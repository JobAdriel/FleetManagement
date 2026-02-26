import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import VehiclesPage from './features/vehicles/VehiclesPage';

class App extends Component {
  render() {
    return (
      <div>
        <Route path="/vehicles" element={<VehiclesPage />} />
      </div>
    );
  }
}

export default App;