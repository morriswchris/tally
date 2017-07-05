"use strict"
const request = require("request");
const Rx = require("rxjs");

const host = "http://api.thescore.com/";
const api_link = "http://www.thescore.com";
const schedule_uri = "/schedule?utc_offset=-";
const events_uri = "/events?id.in=";

class Tally {

  constructor({league, max_requests = null, requests_per_second = 0.1, utc_offset = new Date().getTimezoneOffset() * 60}){
    this.error = false;
    this.league = league;
    this.max_requests = max_requests;
    this.requests = 0;
    this.request_interval = 1000 / requests_per_second;
    this.utc_offset = new Rx.BehaviorSubject(utc_offset);

    return this._fetch();
  }

  _fetch() {
    //makes requests over a period of time
    this.timer_ticks = this._ticks();

    //save our 2 requests to a new subject
    this.scheduledEvents = new Rx.Subject();
    this.events = new Rx.Subject();

    this.eventIds = this.scheduledEvents
      .takeWhile(this._containsEvents)
      .map(this._currentGroupIds);

    //get the events once the scheduled events are found
    this._events();

    //get the scheduled events
    this._scheduledEvents();

    //get the events once the scheduled events are found
    this._events();

    // return our observable to chain to
    return this.events;
  }

  _endpoint(league, data_set, param_data) {
    var uri = data_set === "schedule" ? schedule_uri : events_uri;
    return host + league + uri + encodeURIComponent(param_data);
  }

  _ticks() {
    return Rx.Observable.timer(0, this.request_interval)
      .timeInterval();
  }

  _requests() {
    return this.timer_ticks
      .takeWhile(() => !this.error)
      .withLatestFrom(this.utc_offset, function(_, date) { return date; });
  }

  _scheduledEvents() {
    let requests = this._requests();
    if(this.max_requests) {
      requests = requests.take(this.max_requests);
    }
    requests.subscribe(utc_offset => {
      request(this._endpoint(this.league, "schedule", utc_offset), (error, response,
        body) => {
        if (error) {
          this.error = true;
          this.events.error(new Error(error));
        }

        let events = JSON.parse(body);

        if(!events.current_group) {
          this.error = true;
          this.events.error("No scheduled events could be found");
        }
        else {
          this.requests += 1;
          this.scheduledEvents.next(JSON.parse(body));
        }
      });
    });
  }

  _containsEvents(events) {
    if (!events.current_group) {
      return false;
    }

    return events.current_group.event_ids && events.current_group.event_ids.length > 0;
  }

  _currentGroupIds(schedule) {
    return schedule.current_group.event_ids;
  }

  _events() {
    this.eventIds.subscribe(event_ids => {
      request(this._endpoint(this.league, "event", event_ids), (error, response, body) => {
        if (error) {
          this.events.error(error);
        }
        else {
          this.events.next(JSON.parse(body));
        }
      });
    });
  }
}

module.exports = Tally;
