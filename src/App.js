import React, { useState, useEffect } from 'react';
import {useRef} from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Modal, Button } from 'react-bootstrap';
import './App.css'; // Import your custom CSS if needed

function App() {
  const maxRow = 6, extraRows = 2, maxWrites = 3;
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [log, setLog] = useState([]);
  const [showModal, setShowModal] = useState(true);
  const [nickname, setNickname] = useState('');
  // Reference to the log container for auto-scrolling
  const logContainerRef = useRef(null);
  const [phCellUsage, setPhCellUsage] = useState(Array(maxRow + extraRows).fill(0).map(x => Array(16).fill(0)));
  const [cellContent, setCellContent] = useState(Array(maxRow).fill(0).map(x => Array(16).fill(0)));
  const [phCellMapping, setPhCellMapping] = useState(Array(maxRow + extraRows).fill(0).map((_,i) => Array(16).fill(0).map((_,j) => i*16 + j)));

  // Load nickname from the cookie when the app starts
  useEffect(() => {
    const savedNickname = localStorage.getItem('nickname');
    if (savedNickname) {
      setNickname(savedNickname);
      setShowModal(false);
    }
    localStorage.setItem('cellContent', cellContent);
    localStorage.setItem('phCellMapping', phCellMapping);
    localStorage.setItem('phCellUsage', phCellUsage);
  }, []);
  useEffect(() => {
    // Scroll log container to the bottom
    if (logContainerRef.current) {
      logContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [log]);

  const handleNicknameSubmit = () => {
    setShowModal(false);
    localStorage.setItem('nickname', nickname);
  };

  const handleCommandClear = () => {
    setPhCellUsage(Array(maxRow + extraRows).fill(0).map(x => Array(16).fill(0)));
    setCellContent(Array(maxRow).fill(0).map(x => Array(16).fill(0)));
    setPhCellMapping(Array(maxRow + extraRows).fill(0).map((_,i) => Array(16).fill(0).map((_,j) => i*16 + j)));
  }
  const handleCommandUpload = async () => {
    localStorage.setItem('cellContent', cellContent);
    localStorage.setItem('phCellMapping', phCellMapping);
    localStorage.setItem('phCellUsage', phCellUsage);
    // Send data to backend API
    try {
      const response = await fetch('http://localhost:5001/api/store', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname, 
          cellContent: cellContent.flat(),
          phCellUsage: phCellUsage.flat(),
          phCellMapping: phCellMapping.flat(),
        }),
      });
      const responseData = await response.json();
      console.log(responseData.message);
    } catch(error) {
      console.error('Error storing data:', error);
    }
  };

  const handleCommandExecute = () => {
    var sanInput = input.replace(/[^A-Fa-f0-9]/ig,"");
    var mainCmd = sanInput.slice(0,2);
    var targetAddress = sanInput.slice(2,4);
    var targetRow = parseInt(targetAddress[0], 16);
    var targetCol = parseInt(targetAddress[1], 16);
    var response = "";
    // Process EEPROM command logic
    if (mainCmd === '02') {
      if (sanInput.length != 4) {
        response = `'${sanInput}' Read Error: Syntax: 02 [Address]`;
      } else {
        if (targetRow < maxRow) {
          var hexString = ("00" +
            cellContent[targetRow][targetCol].toString(16).toUpperCase()).
            substr(-2);
          response = `'${sanInput}' Address ('${targetAddress}') data: '${hexString}'.`;
        }
        else {
          response = `'${sanInput}' Error: Read Address ('${targetAddress}') out of bounds.`;
        }
      }
    } else if (mainCmd === '03') {
      if (sanInput.length != 6) {
        response = `'${sanInput}' Write Error: Syntax: 03 [Address] [Data]`;
      } else {
        var extraResponse = "";
        if (targetRow < maxRow) {
          var targetData = parseInt(sanInput.slice(4,6), 16);
          var newPhCellUsage = phCellUsage;
          if (newPhCellUsage[Math.floor(phCellMapping[targetRow][targetCol]/16)][phCellMapping[targetRow][targetCol]%16] + 1 > maxWrites) {
            // Replace with another cell
            var newPhCellMapping = phCellMapping, found = false;
            for (var k = maxRow * 16; found == false && k < (maxRow + extraRows) * 16; k++) {
              if (newPhCellMapping[Math.floor(k/16)][k%16] >= maxRow * 16) {
                var newCellContent = cellContent;
                newCellContent[targetRow][targetCol] = targetData;
                setCellContent(newCellContent);
                newPhCellMapping[targetRow][targetCol] = k;   
                newPhCellMapping[Math.floor(k/16)][k%16] = targetRow*16+targetCol;   
                setPhCellMapping(newPhCellMapping);
                newPhCellUsage[Math.floor(phCellMapping[targetRow][targetCol]/16)][phCellMapping[targetRow][targetCol]%16]++;
                setPhCellUsage(newPhCellUsage);
                response = `'${sanInput}' Max writes exceeded for current physical cell, replacing by a new one.\nAddress ('${targetAddress}') written with data ('${sanInput.slice(4,6)}').`;
                found = true;
                break;
              }
            }
            if (found === false) {
              response = `'${sanInput}' Max writes exceeded for current physical cell, no more physical cell availables, write is not being performed over address '${targetAddress}'.`;
            }
          } else {
            var newCellContent = cellContent;
            newCellContent[targetRow][targetCol] = targetData;
            setCellContent(newCellContent);
            newPhCellUsage[Math.floor(phCellMapping[targetRow][targetCol]/16)][phCellMapping[targetRow][targetCol]%16]++;
            setPhCellUsage(newPhCellUsage);
            response = `'${sanInput}' Address ('${targetAddress}') written with data ('${sanInput.slice(4,6)}').`;
          }
        }
        else {
          response = `'${sanInput}' Error: Write Address ('${targetAddress}') out of bounds.`;
        }
      }
    } else {
      response = `'${sanInput}' Error: Unknown command.`;
    }
    setOutput(response);

    // Update log
    setLog([...log, { command: input.replace(/[^A-Fa-f0-9]/ig,""), response }]);
    localStorage.setItem('cellContent', cellContent);
    localStorage.setItem('phCellMapping', phCellMapping);
    localStorage.setItem('phCellUsage', phCellUsage);
  };

  return (
    <div>
      <Navbar>
        <Navbar.Brand>
          <img
            src="your-logo.png" // Replace with your logo URL
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="Logo"
          />
          {' Your Logo'}
        </Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Link href="#about">About</Nav.Link>
        </Nav>
      </Navbar>

      <Container fluid className="mt-4">
        <Row>
          <Col style={{minWidth: "760px", maxWidth: "760px"}}>
            <Card>
              <Card.Body>
                <Card.Title><strong>{nickname}</strong>'s EEPROM</Card.Title>
                  <svg width="100%" height={`${(maxRow*70).toString(10)}px`}>
                  {Array.from({ length: maxRow }, (_, rowIndex) => (
                    Array.from({ length: 16 }, (_, colIndex) => {
                      const x = (colIndex + 1) * 40; // Adjust the box width and spacing as needed
                      const y = (rowIndex + 1) * 60 - 35; // Adjust the box height and spacing as needed
                      const colLabel = `${colIndex.toString(16)}`;
                      const rowLabel = `${rowIndex.toString(16)}`;
                      const cellContentLabel = ("00" + cellContent[rowIndex][colIndex].toString(16).toUpperCase()).substr(-2);
                      const phCellMappingLabel = ("00" + phCellMapping[rowIndex][colIndex].toString(16).toUpperCase()).substr(-2);
                      const phCellRow = Math.floor(phCellMapping[rowIndex][colIndex]/16);
                      const phCellColumn = phCellMapping[rowIndex][colIndex]%16;
                      const phCellUsageLabel = ("00" + phCellUsage[phCellRow][phCellColumn].toString(16).toUpperCase()).substr(-2);
                      const allZeros = (cellContentLabel==="00");

                      return (
                        <>
                        <g key={`${rowIndex}-${colIndex}-${cellContentLabel}`}>
                          // Cell content box
                          <rect x={x} y={y} width="40" height="40" fill={(allZeros?"#000000":"#4f4f4f")} stroke="#000000" />
                          // Cell content
                          <text x={x + 20} y={y + 25} textAnchor="middle" fill="#00ff00" fontSize="18" fontFamily="monospace" fontWeight={(allZeros?"normal":"bold")}>
                            {cellContentLabel}
                          </text>
                          // Physical address box 
                          <rect x={x} y={y+40} width="20" height="20" fill="#fc8464" />
                          <text x={x + 2} y={y + 55} textAnchor="left" fontWeight="bold" fill="black" fontSize="12">
                            {phCellMappingLabel}
                          </text>
                          // Usage box
                          <rect x={x + 20} y={y+40} width="20" height="20" fill="#5a94a8" />
                          <text x={x + 22} y={y + 55} textAnchor="right" fontSize="12" fontWeight="bold" fill="white">
                            {phCellUsageLabel}
                          </text>
                        </g>
                        ((colIndex === 0) ? (
                          <text x={20} y={y + 25} fill="white" textAnchor="middle" fontSize="12">
                            {rowLabel}
                          </text>
                        ) : "");
                        ((rowIndex === 0) ? (
                          <text x={x + 20} y={10} fill="white" textAnchor="middle" fontSize="12">
                            {colLabel}
                          </text>
                        ) : "");
                        </>
                      );
                    })
                  ))}
                  </svg>
              </Card.Body>
            </Card>
          </Col>
          <Col style={{minWidth: "300px", maxWidth: "760px"}}>
          <Container fluid>
          <Row>
            <Card>
              <Card.Body>
                <Card.Title>EEPROM Command Interpreter</Card.Title>
                <input
                  type="text"
                  value={input}
                  pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?"
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter EEPROM command"
                  className="form-control mb-2"
                />
                <button onClick={handleCommandExecute} className="btn btn-primary">
                  Execute
                </button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <button onClick={handleCommandClear} className="btn btn-warning">
                  Clear
                </button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <button onClick={handleCommandUpload} className="btn btn-secondary">
                  Upload
                </button>
                <hr/>
                <div className="log">
                  {log.map((entry, index) => (
                    <div key={index} className="log-entry">
                      <div><strong>Command:</strong> {entry.command}</div>
                      <div><strong>Response:</strong> {entry.response}</div>
                    </div>
                  ))}
                <div ref={logContainerRef} />
                </div>
              </Card.Body>
            </Card>
          </Row>
          </Container>
          </Col>
        </Row>
      </Container>


      <Container className="mt-4">
        <Row>
          <Col md={6}>
          </Col>
            <Col md={6}>
            </Col>
        </Row>
      </Container>

      {/* Nickname Modal */}
      <Modal show={showModal} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Enter Your Nickname</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="form-control"
            placeholder="Enter your nickname"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleNicknameSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;

