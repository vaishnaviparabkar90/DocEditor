import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Image } from 'react-bootstrap';
import { AiFillFileText } from 'react-icons/ai'; // Icon for DocEditor logo
import { auth } from '../firebase'; // Import your Firebase authentication setup

const Header = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        setUser(null);
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand href="/" className="d-flex align-items-center">
                    <AiFillFileText size={30} className="mr-3" />
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>DocEditor</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav>
                        <Nav.Link href="/">Home</Nav.Link>
                        {!user ? (
                            <>
                                <Nav.Link href="/login">Login</Nav.Link>
                                <Nav.Link href="/signup">Signup</Nav.Link>
                            </>
                        ) : (
                            <>
                                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                                <div className="d-flex align-items-center" style={{ marginLeft: '15px' }}>
                                    <Image
                                        src={user.photoURL || 'https://www.example.com/default-profile.png'} // Default picture
                                        roundedCircle
                                        style={{ width: '40px', height: '40px' }}
                                    />
                                    <span className="text-white ml-2">{user.displayName || 'User'}</span> {/* Default name */}
                                </div>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;
