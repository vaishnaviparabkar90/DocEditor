import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
    return (
        <footer className="text-center py-3 bg-dark text-white mt-auto">
            <Container>
            <p>© 2024 DocEditor. All rights reserved.</p>
                <p>Contact us: <a href="mailto:parabkarvaishnavi24@gmail.com" className="text-white">parabkarvaishnavi24@gmail.com</a></p>
                <p>For complaints or feedback, feel free to reach out!</p>
            </Container>
        </footer>
    );
};

export default Footer;
