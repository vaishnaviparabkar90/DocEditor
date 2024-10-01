// src/components/Home.jsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container className="mt-5 text-center">
      <Row>
        <Col>
          <h1>Welcome to DocEditor</h1>
          <p className="lead">Create, edit, and manage your documents easily.</p>
          <Link to="/signup">
            <Button variant="primary" size="lg" className="mt-3">
              Get Started
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
