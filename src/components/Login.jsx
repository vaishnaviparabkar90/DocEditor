import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';  // Ensure this path is correct
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Container, Row, Col } from 'react-bootstrap';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false); // Ensure this state is included
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false); // Reset success state before login attempt
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setSuccess(true);
                navigate('/editor'); // Redirect after successful login
          // Delay to show success message
        } catch (error) {
            setError(error.message); // Handle any errors
            console.error("Error logging in:", error);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/editor');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container fluid className="vh-100 d-flex justify-content-center align-items-center">
            <Row className="justify-content-center w-100">
                <Col xs={12} md={6} lg={4}>
                    <h2 className="text-center mb-4">Login</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">Login successful! Redirecting...</div>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group controlId="formBasicEmail" className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="Enter email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword" className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control 
                                type="password" 
                                placeholder="Enter password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 mb-3">
                            Login
                        </Button>
                    </Form>

                    <div className="text-center">
                        <p>Or login with Google</p>
                        <Button variant="danger" onClick={handleGoogleLogin} className="w-100">
                            <i className="fab fa-google"></i> Sign in with Google
                        </Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
