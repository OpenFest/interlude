class Schedule {
	constructor(room, date, nowFunc) {

		this.apiEndpointPrefix = 'https://cfp.openfest.org/openfest-2025';

		this.nextLectureDelayMinutes = 4;  // show the current lecture as next for the first N minutes

		if(date) this.date = date;
		this.room = room;
		this.nowFunc = nowFunc;


		// default to *actual* now if nowFunc not defined
		this.now = () => moment(this.nowFunc?.call())
			.subtract(this.nextLectureDelayMinutes, 'minutes');

		console.log(this.now());

		this.roomMap = {
			'A': 'Зала A',
			'B': 'Зала B',
		};

	}

	roomName() { return this.roomMap[this.room]; }

	async update() {
		const response = await fetch(this.apiEndpointPrefix + '/schedule/export/schedule.json?lang=bg');
		if(!response.ok) { console.log("mrun"); return; }

		const fullSchedule = await response.json();
		const days = fullSchedule['schedule']['conference']['days'];

		// select the current day, fallback to first day of conference
		const today = this.date ? moment(this.date) : this.now();
		let day = 0;
		for(let i = 0; i < days.length; ++i) if(moment(days[i].date).isSame(today, 'day')) day = i;

		const schedule = days[day]['rooms'][this.roomMap[this.room]];

		this.events = schedule.map(slot => ({
			startTime: moment(slot.date),
			endTime: moment(slot.date).add(moment.duration(slot.duration)),
			...slot,
		}));
	}

	upcomingEvents() {
		return this.events.filter(e => e.startTime.isAfter(this.now()));
	}

	nextEvent() {
		return this.upcomingEvents()[0];
	}

	currentEvent() {
		const latestEvent = this.pastEvents().slice(-1).pop(); // get last, this is a huge js-ism
		return latestEvent?.endTime.isAfter(this.now()) ? latestEvent : undefined;
	}

	futureEvents() {
		return this.upcomingEvents().slice(1);
	}

	pastEvents() {
		return this.events.filter(e => e.startTime.isBefore(this.now()));
	}

	allEvents() {
		return this.events;
	}
}

// const urlParams = new URLSearchParams(document.location.search);

// const schedule = Schedule(urlParams.get("room"), urlParams.get("day"), urlParams.get("now"), true).then(x => x);
