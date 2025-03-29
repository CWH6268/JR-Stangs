import React, { useEffect, useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';

const FilterControls = ({ players, filters, setFilters }) => {
  const [schools, setSchools] = useState([]);

  // Extract unique values for school dropdown
  useEffect(() => {
    if (players.length > 0) {
      // Get unique schools
      const uniqueSchools = [...new Set(players.map((player) => player.School))].filter(Boolean);
      setSchools(uniqueSchools.sort());
    }
  }, [players]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      position: '',
      school: '',
      searchTerm: '',
    });
  };

  // Quick position filter buttons
  const quickPositionFilter = (positionKeyword) => {
    setFilters({
      ...filters,
      position: positionKeyword,
    });
  };

  return (
    <div className="filter-section">
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Search</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by name or jersey #"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>School</Form.Label>
            <Form.Select value={filters.school} onChange={(e) => handleFilterChange('school', e.target.value)}>
              <option value="">All Schools</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={2} className="d-flex align-items-end">
          <Button className="btn-clear-all mb-3 w-100" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Quick position filter buttons */}
      <div className="quick-filter-section">
        <small className="text-muted fw-bold">Position Filters:</small>
        <div className="filter-buttons">
          <Button
            className={`filter-btn ${filters.position === 'Quarterback' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Quarterback')}
          >
            QB
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Receiver' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Receiver')}
          >
            WR
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'H' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('H')}
          >
            H
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Running Back' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Running Back')}
          >
            RB
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Offensive Lineman' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Offensive Lineman')}
          >
            OL
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Defensive Back' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Defensive Back')}
          >
            DB
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Linebacker' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Linebacker')}
          >
            LB
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Defensive Lineman' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Defensive Lineman')}
          >
            DL
          </Button>
          <Button
            className={`filter-btn ${filters.position === 'Other' ? 'active' : ''}`}
            onClick={() => quickPositionFilter('Other')}
          >
            Other
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
