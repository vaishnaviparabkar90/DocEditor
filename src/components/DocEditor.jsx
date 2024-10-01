import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Button, Dropdown, ButtonGroup } from 'react-bootstrap';
import './DocEditor.css'; // Custom styles
//import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';
import { db } from '../firebase'; // Adjust the path as needed to import your Firebase configuration
import { collection, addDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDoc,query, where } from "firebase/firestore";  
import { getAuth } from "firebase/auth";


const DocEditor = () => {
 const [documentId, setDocumentId] = useState(null); // To store the documentId
  const [content, setContent] = useState('');
  const [cursors, setCursors] = useState({});

    const quills = useRef([]); // Store refs for multiple Quill instances
    
    const quillRefs = useRef([]); // Store refs for multiple pages
    const [pages, setPages] = useState([1]); // Start with one page
    const [currentPage, setCurrentPage] = useState(0); // Track current page index
    const [zoomLevel, setZoomLevel] = useState(100); // Default zoom level
    const [collaboratorEmail, setCollaboratorEmail] = useState(''); // Email input state
    const [collaboratorRole, setCollaboratorRole] = useState('editor'); 

    useEffect(() => {
        if (!quillRefs.current[0]) {
          const quill = new Quill(quillRefs.current[0], { theme: 'snow' });
          quills.current[0] = quill;
        }
      }, []);
      
    useEffect(() => {
        const quill = new Quill(quillRefs.current[0], {
            theme: 'snow',
            modules: {
                toolbar: false, // Custom toolbar
            },
           
        });
        
        quill.format('direction', 'ltr');
        quill.format('align', 'left');

       
        quills.current[0] = quill; // Store the Quill instance
        quill.setText('Start writing your document here...');
        
       


        // Set some initial content
        
        quill.on('text-change', async () => {
            const newContent = quill.root.innerHTML; // Get updated content
            if (documentId) {
                await updateDoc(doc(db, 'documents', documentId), {
                    content: newContent, // Save the new content
                    updatedAt: new Date(), // Update the timestamp
                });
            }
        });

        quill.on('selection-change', async (range) => {
            if (range && documentId) {
                const userId = 'user1'; // Replace this with unique user identification (e.g., Firebase Auth)
                const cursorPosition = range.index; // Get the current cursor position
        
                // Update Firestore with the cursor position
                try {
                    await updateDoc(doc(db, 'documents', documentId), {
                        [`cursors.${userId}`]: cursorPosition // Store the user's cursor position in Firestore
                    });
                } catch (error) {
                    console.error("Error updating cursor position in Firestore: ", error);
                }
            }
        });
       
         
        
        const createDocument = async () => {
            const auth = getAuth();
            const user = auth.currentUser; // Get the current user
        
            if (user) {
              const ownerEmail = user.email; // Get the user's email
        
              if (!documentId) { // Ensure we don't create duplicate documents
                try {
                  const docRef = await addDoc(collection(db, 'documents'), {
                    content: '<p>Start writing your document here...</p>',
                    cursors: {}, // Add cursors field to track positions
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    owner: ownerEmail, // Use the fetched email of the owner
                    collaborators: [] // Start with an empty array of collaborators
                  });
                  setDocumentId(docRef.id); // Save the document ID
                } catch (error) {
                  console.error("Error creating document: ", error);
                }
              }
            } else {
              console.error("User is not logged in."); // Handle case where user is not logged in
            }
          };
        
        
        createDocument();
        // Add custom toolbar functionality
        const toolbar = document.querySelector('.toolbar');
        toolbar.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target;

            // Undo functionality
            if (target.matches('.btn-undo')) {
                quill.history.undo();
            }
            // Redo functionality
            else if (target.matches('.btn-redo')) {
                quill.history.redo();
            }
            // Zoom functionality
            else if (target.matches('.zoom-dropdown-item')) {
                const zoom = target.dataset.zoom;
                setZoomLevel(zoom);
                quill.root.style.zoom = zoom + '%'; // Apply zoom
            }
            // Font family selection
            else if (target.matches('.font-dropdown-item')) {
                const font = target.dataset.font;
                quill.format('font', font);
            }
            // Font size selection
            else if (target.matches('.font-size-dropdown-item')) {
                const size = target.dataset.size;
                quill.format('size', size);
            }
            // Text formatting
            else if (target.matches('.btn-bold')) {
                quill.format('bold', !quill.getFormat().bold);
            } else if (target.matches('.btn-italic')) {
                quill.format('italic', !quill.getFormat().italic);
            } else if (target.matches('.btn-underline')) {
                quill.format('underline', !quill.getFormat().underline);
            }
            // Text color
            else if (target.matches('.btn-text-color')) {
                const color = prompt('Enter text color (hex, rgb, etc.)', '#000000');
                if (color) {
                    quill.format('color', color);
                }
            }
            // Highlight color
            else if (target.matches('.btn-highlight')) {
                const highlightColor = prompt('Enter highlight color (hex, rgb, etc.)', '#FFFF00');
                if (highlightColor) {
                    quill.format('background', highlightColor);
                }
            }
            // Insert image
            else if (target.matches('.btn-insert-image')) {
                const url = prompt('Enter image URL');
                if (url) {
                    quill.insertEmbed(quill.getSelection().index, 'image', url);
                }
            }
            // Text alignment
            else if (target.matches('.btn-align')) {
                const align = target.dataset.align;
                quill.format('align', align);
            }
            // Add a new page
            else if (target.matches('.btn-add-page')) {
                addPage(); // Function to add a new page
            }
        });

           
        return () => {
            toolbar.removeEventListener('click', () => {});
        };
    }, [documentId]);
    
    useEffect(() => {
        if (documentId) {
            const docRef = doc(db, 'documents', documentId);
    
            const unsubscribe = onSnapshot(docRef, (doc) => {
                const updatedContent = doc.data().content;
                const cursors = doc.data().cursors || {};
    
                // 1. Capture the current cursor position
                const userId = 'user1'; // Replace with actual user ID
                const currentUserCursor = quills.current[currentPage].getSelection()?.index || 0; // Get current cursor position
    
                // 2. Update the content without resetting cursor position
                const editorContent = quills.current[currentPage].root.innerHTML;
                if (updatedContent !== editorContent) {
                    quills.current[currentPage].root.innerHTML = updatedContent; // Sync content to Quill editor
                }
    
                // 3. Restore the cursor position
                if (currentUserCursor) {
                    quills.current[currentPage].setSelection(currentUserCursor); // Restore user's cursor
                }
    
                // 4. Handle cursor positions for all users
                Object.keys(cursors).forEach((otherUserId) => {
                    if (otherUserId !== userId && cursors[otherUserId]) {
                        // Display other users' cursor (Optional: highlight cursor with visual marker)
                        quills.current[currentPage].formatText(cursors[otherUserId], 1, { background: '#FFC107' });
                    }
                });
            });
    
            return () => unsubscribe(); // Cleanup listener on component unmount
        }
    }, [documentId, currentPage]);

  // Subscribe to document changes in Firestore
  useEffect(() => {
    // Check if documentId is valid
    if (!documentId) {
      console.error("Document ID is not provided");
      return; // Exit early if documentId is null or undefined
    }

    // Subscribe to document changes in Firestore
    const unsubscribe = onSnapshot(doc(db, "documents", documentId), (doc) => {
      if (doc.exists()) {
        setContent(doc.data().content); // Update content with Firestore data
        setCursors(doc.data().cursors || {}); // Track cursors of collaborators
      } else {
        console.error("Document not found");
      }
    });

    return () => unsubscribe(); // Clean up the subscription on unmount
  }, [documentId]); 

const handleChange = (newContent) => {
  setContent(newContent); // Update local state

  const docRef = doc(db, "documents", documentId);

  // Update Firestore document with new content
  updateDoc(docRef, {
    content: newContent,
    updatedAt: new Date(), // Optional: track when the change was made
  });
};
const handleCursorChange = (position) => {
  const user = getAuth().currentUser;

  if (user) {
    const docRef = doc(db, "documents", documentId);

    // Update Firestore document with the user's cursor position
    updateDoc(docRef, {
      [`cursors.${user.email}`]: position,
    });
  }
};

    
    // Run when documentId or currentPage changes
    

    const downloadDocument = () => {
        const quill = quills.current[currentPage]; // Get the current Quill instance
        const text = quill.getText(); // Get the plain text content
        const blob = new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); // Create a blob with the text content
        const url = URL.createObjectURL(blob); // Create a URL for the blob
        const a = document.createElement('a'); // Create an anchor element
        a.href = url; // Set the URL to the anchor
        a.download = 'document.doc'; // Set the name of the downloaded file
        document.body.appendChild(a); // Append the anchor to the body
        a.click(); // Simulate a click to trigger the download
        document.body.removeChild(a); // Remove the anchor from the body
        URL.revokeObjectURL(url); // Release the blob URL
    };
    
    const exportToPDF = () => {
        const quill = quills.current[currentPage];
        const content = quill.root.innerHTML;
    
        // Create a temporary element to hold the content
        const element = document.createElement('div');
        element.innerHTML = content;
    
        // Set styles for the temporary element
        element.style.fontSize = '12px'; // Set your desired font size here
        element.style.padding = '10px'; // Optional: Add some padding
        document.body.appendChild(element); // Append to the body (hidden from view)
    
        // Convert to PDF
        html2pdf()
            .from(element).set({
        margin: 1,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 }, // Increase scale for better quality
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    })
            .save('document.pdf') // Specify the name of the PDF file
            .then(() => {
                document.body.removeChild(element); // Clean up by removing the temp element
            });
    };
     const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop;
        const pageHeight = 440; // Adjust this height according to the page height
        const newPage = Math.floor(scrollTop / pageHeight);
        setCurrentPage(newPage);
    };

    const addCollaborator = async () => {
        if (!documentId || !collaboratorEmail) {
          setErrorMessage("Please provide a document ID and collaborator email.");
          return;
        }
      
        try {
          const docRef = doc(db, "documents", documentId);
          const docSnap = await getDoc(docRef);
      
          if (docSnap.exists()) {
            const docData = docSnap.data();
            const updatedCollaborators = {
              ...docData.collaborators,
              [collaboratorEmail]: collaboratorRole,
            };
      
            // Update Firestore with new collaborator
            await updateDoc(docRef, { collaborators: updatedCollaborators });
      
            // Send email notification to the collaborator
            await fetch('http://localhost:5000/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: collaboratorEmail,
                role: collaboratorRole,
                documentId: documentId,
              }),
            });
      
            alert(`Added ${collaboratorEmail} as a ${collaboratorRole} and sent email notification`);
            setCollaboratorEmail(''); // Reset email input
            setErrorMessage('');
          } else {
            console.error("Document not found!");
          }
        } catch (error) {
          console.error("Error adding collaborator: ", error);
          setErrorMessage("Failed to add collaborator");
        }
      };
      

      const getSharedDocuments = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const userEmail = user.email;

    // Query for documents where the user is the owner or a collaborator
    const docsRef = collection(db, "documents");
    const q = query(docsRef, where(`collaborators.${userEmail}`, "!=", null));

    const querySnapshot = await getDocs(q);
    const sharedDocuments = [];
    querySnapshot.forEach((doc) => {
      sharedDocuments.push({ id: doc.id, ...doc.data() });
    });

    return sharedDocuments;
  } else {
    console.error("User not authenticated.");
  }
};
const subscribeToDocument = (documentId, setContent) => {
  const docRef = doc(db, "documents", documentId);

  const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      setContent(data.content);  // Update the content in the UI
    } else {
      console.error("Document not found!");
    }
  });

  return unsubscribe; // Call this to stop listening when needed
};
    return (
        <div className="doc-editor">
            <div className="toolbar mb-3">
                <ButtonGroup>
                <Button className="btn-export-pdf" variant="dark" onClick={exportToPDF} title="Export to PDF">
        <i className="fas fa-file-pdf"></i> Export PDF
    </Button>

                <Button className="btn-download" variant="dark" onClick={downloadDocument} title="Download Document">
    <i className="fas fa-file-download"></i> Download
</Button>



                    <Button className="btn-undo" variant="light" title="Undo">
                        <i className="fas fa-undo"></i>
                    </Button>
                    <Button className="btn-redo" variant="light" title="Redo">
                        <i className="fas fa-redo"></i>
                    </Button>
                    {/* Zoom Dropdown */}
                    <Dropdown className="zoom-dropdown">
                        <Dropdown.Toggle variant="light" id="dropdown-basic">
                            Zoom: {zoomLevel}%
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item className="zoom-dropdown-item" data-zoom="25">25%</Dropdown.Item>
                            <Dropdown.Item className="zoom-dropdown-item" data-zoom="50">50%</Dropdown.Item>
                            <Dropdown.Item className="zoom-dropdown-item" data-zoom="75">75%</Dropdown.Item>
                            <Dropdown.Item className="zoom-dropdown-item" data-zoom="100">100%</Dropdown.Item>
                            <Dropdown.Item className="zoom-dropdown-item" data-zoom="125">125%</Dropdown.Item>
                            <Dropdown.Item className="zoom-dropdown-item" data-zoom="150">150%</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Font Family Dropdown */}
                    <Dropdown className="font-dropdown">
                        <Dropdown.Toggle variant="light" id="font-dropdown">
                            Font
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item className="font-dropdown-item" data-font="serif">Serif</Dropdown.Item>
                            <Dropdown.Item className="font-dropdown-item" data-font="sans-serif">Sans Serif</Dropdown.Item>
                            <Dropdown.Item className="font-dropdown-item" data-font="monospace">Monospace</Dropdown.Item>
                            <Dropdown.Item className="font-dropdown-item" data-font="arial">Arial</Dropdown.Item>
                            <Dropdown.Item className="font-dropdown-item" data-font="comic-sans">Comic Sans</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    {/* Font Size Dropdown */}
                    <Dropdown className="font-size-dropdown">
                        <Dropdown.Toggle variant="light" id="font-size-dropdown">
                            Size
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item className="font-size-dropdown-item" data-size="small">Small</Dropdown.Item>
                            <Dropdown.Item className="font-size-dropdown-item" data-size="normal">Normal</Dropdown.Item>
                            <Dropdown.Item className="font-size-dropdown-item" data-size="large">Large</Dropdown.Item>
                            <Dropdown.Item className="font-size-dropdown-item" data-size="huge">Huge</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Button className="btn-bold" variant="light" title="Bold">
                        <i className="fas fa-bold"></i>
                    </Button>
                    <Button className="btn-italic" variant="light" title="Italic">
                        <i className="fas fa-italic"></i>
                    </Button>
                    <Button className="btn-underline" variant="light" title="Underline">
                        <i className="fas fa-underline"></i>
                    </Button>
                    <Button className="btn-text-color" variant="light" title="Text Color">
                        <i className="fas fa-paint-brush"></i>
                    </Button>
                    <Button className="btn-highlight" variant="light" title="Highlight Color">
                        <i className="fas fa-highlighter"></i>
                    </Button>
                    <Button className="btn-insert-image" variant="light" title="Insert Image">
                        <i className="fas fa-image"></i>
                    </Button>
                    <Button className="btn-align" data-align="left" variant="light" title="Align Left">
                        <i className="fas fa-align-left"></i>
                    </Button>
                    <Button className="btn-align" data-align="center" variant="light" title="Align Center">
                        <i className="fas fa-align-center"></i>
                    </Button>
                    <Button className="btn-align" data-align="right" variant="light" title="Align Right">
                        <i className="fas fa-align-right"></i>
                    </Button>
                    <Button className="btn-align" data-align="justify" variant="light" title="Justify">
                        <i className="fas fa-align-justify"></i>
                    </Button>
                 
                </ButtonGroup>
            </div>
            <div className="my-3">

        <div className="row g-3 align-items-center">
          <div className="col-auto">
            <label htmlFor="collaboratorEmail" className="col-form-label fw-bold">Collaborator Email</label>
          </div>
          <div className="col-md-4">
            <input
              type="email"
              id="collaboratorEmail"
              className="form-control"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              placeholder="Enter collaborator's email"
            />
          </div>
          <div className="col-auto">
            <label htmlFor="collaboratorRole" className="col-form-label fw-bold">Role</label>
          </div>
          <div className="col-md-2">
            <select
              id="collaboratorRole"
              className="form-select"
              value={collaboratorRole}
              onChange={(e) => setCollaboratorRole(e.target.value)}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="col-auto">
            <Button variant="primary" onClick={addCollaborator}>Share Document</Button>
          </div>
        </div>
      </div>
     
    

      {/* You can add more UI components here */}
<div>
  <h3>Collaborator Cursors:</h3>
  <div className="col-form-label fw-bold">
  {Object.entries(cursors).map(([email, position]) => (
    <p key={email}>{email}: Cursor at {position} </p>
  ))}
  </div>
</div>



            <div className="document-container" onScroll={handleScroll}>
                {pages.map((_, index) => (
                    <div key={index} className="document-page a4-page">
                        <div ref={(el) => (quillRefs.current[index] = el)} style={{ height: '440px' }}></div>
                        <p className="current-page">Page {index + 1}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocEditor;