import React, { Component } from 'react';
import request from 'superagent';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      routes: {
        work: [],
        home: []
      },
      notifications: false
    };
    this.getTracker = this.getTracker.bind(this);
  } 

  componentDidMount() {
    this.getTracker();
    window.setInterval(this.getTracker, 60*1000);
  }

  /*
  componentDidUpdate(prevProps, prevState) {
    Object.keys(this.state.routes)
    .forEach(route => {
      const leaveFor = this.timeToLeave(route, prevState.routes[route]);
      if (leaveFor) {
        // send notification
      }
    });
    // TODO: determine if notification should be sent
  }
  */

  getTracker() {
    console.log('getting tracker');
    request
    .get('https://proxy-prod.511.org/api-proxy/api/v1/transit/tracker/')
    .query({ uuid: this.props.trackerUUID })
    .then(res => {
      this.setState({ routes: this.formatAPIResponse(res.body) });
    })
    .catch(err => {
      throw err;
    });
  }
  
  formatAPIResponse(body) {
    const routes = body.real_time_departure_objects;
    const formattedRoutes = routes
    // filter out routes lacking next departure times
    .filter(route => route.hasOwnProperty('next_departure_time_min'))
    .map(route =>
      Object.assign(
        {}, 
        route, 
        { next_departure_time_min: 
          route.next_departure_time_min
          .map(Number)
          .filter(time => time <= this.props.maxTime)
        }
      )
    );
    return {
      work: formattedRoutes.filter(route => route.route_direction_code === 'Inbound'),
      home: formattedRoutes.filter(route => route.route_direction_code === 'Outbound')
    };
  }

  // TODO
  /*
  timeToLeave(routeName, prevRoute) {
    this.state.routes[routeName]
    .filter(route => {
      const distance = this.props.stations[routeName].distance;
      return false;
    });
  }
  */

  getStopKey(route) {
    return route.stop_name.toLowerCase().split(' ')[0]
  }

  renderTicker(direction) {
    return <figure className="ticker">
      {new Array(this.props.maxTime)
      .fill(null)
      .map((_, index) => {
        const num = index;
        // station to depart for at this time index
        const departFor = Object.keys(this.props.stations)
        .filter(station =>
          this.props.stations[station].direction === direction && 
          this.props.stations[station].distance === this.props.maxTime - (num+1)
        )[0];
        return <div className={`tick ${num % 5 === 0 ? 'multiple-5' : ''}`}
                    style={{ 
                      borderColor: departFor ? this.props.stations[departFor].color : '',
                      borderWidth: departFor ? 3 : ''
                    }} 
                    key={num}>
          {this.props.maxTime - num}
        </div>
      })}
    </figure>
  }

  renderTrains(direction) {
    if (!this.state.routes.hasOwnProperty(direction)) {
      return <figure className="trains"></figure>
    }
    return <figure className="trains">
      {this.state.routes[direction].map(route => 
        route.next_departure_time_min.map(time => 
          <div className="train" 
               style={{
                 left: `${((this.props.maxTime-time)/this.props.maxTime)*100}%`,
                 color: this.props.stations[this.getStopKey(route)].color
               }}
               key={`${route.stop_code}-${time}`}
               title={`${time}m`}>
            ▼
          </div>))}
    </figure>
  }

  render() {

    return (
      <div className="App">
        <h1>🏠 ↔ 💼  🚆⏳</h1>

        <legend>
          {Object.keys(this.props.stations).map(station => 
            <span className="station-name" key={station}
                  style={{color: this.props.stations[station].color}}>{station}</span>)}
        </legend>

        <section id="home-work" className="commute">
          <h2>🏠 → 💼</h2>
          {this.renderTrains('work')}
          {this.renderTicker('work')}
        </section>

        <section id="work-home" className="commute">
          <h2>💼 → 🏠</h2>
          {this.renderTrains('home')}
          {this.renderTicker('home')}
        </section>

        <footer>
          <a href={`http://511.org/transittracker/?uuid=${this.props.trackerUUID}`}>
            Transit tracker data source
          </a>
        </footer>
      </div>
    );
  }
}

App.defaultProps = {
  trackerUUID: '7fc9e591-cc32-41d1-a3e0-a31d7dfb13be',
  maxTime: 30, // minutes
  stations: {
    gish: {
      direction: 'work',
      color: '#3C5092',
      distance: 8 // minutes
    },
    metro: {
      direction: 'work',
      color: '#BD8E25',
      distance: 9 // minutes
    },
    karina: {
      direction: 'home',
      color: '#563C94',
      distance: 6 // minutes
    }
  }
};

export default App;
