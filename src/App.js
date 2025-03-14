// Whiteboard Component - Enhanced with KendoReact Components & Real-Time Collaboration
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { ColorPicker, Input, NumericTextBox, Slider } from '@progress/kendo-react-inputs';
import { AppBar, AppBarSection, AppBarSpacer, Avatar, Drawer, DrawerContent, DrawerItem } from '@progress/kendo-react-layout';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { TileLayout } from '@progress/kendo-react-layout';
import { TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { Stepper } from '@progress/kendo-react-layout';
import { Notification } from '@progress/kendo-react-notification';
import { Chat } from '@progress/kendo-react-conversational-ui';
import { Chart, ChartSeries, ChartSeriesItem } from '@progress/kendo-react-charts';
import { Tooltip } from '@progress/kendo-react-tooltip';
import { Loader } from '@progress/kendo-react-indicators';
import { PDFExport } from '@progress/kendo-react-pdf'; // Corrected import
import { io } from 'socket.io-client';
import '@progress/kendo-theme-material/dist/all.css';
import './Whiteboard.css';

const socket = io("http://localhost:4000");

const tools = ["Pencil", "Line", "Rectangle", "Circle", "Triangle", "Star", "Polygon", "Ellipse", "Arrow", "Text", "Eraser"];
const brushStyles = ["solid", "dashed", "dotted"];
const lineCaps = ["round", "square", "butt"];
const lineJoins = ["round", "bevel", "miter"];
const fonts = ["Arial", "Times New Roman", "Courier New", "Verdana"];
const cursors = ["default", "crosshair", "pointer"];
const gradients = ["linear", "radial"];
const patterns = ["dots", "lines", "squares"];

const Whiteboard = () => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokeColor, setStrokeColor] = useState("black");
    const [fillColor, setFillColor] = useState("transparent");
    const [gradientType, setGradientType] = useState("linear");
    const [patternType, setPatternType] = useState("dots");
    const [brushSize, setBrushSize] = useState(3);
    const [brushStyle, setBrushStyle] = useState("solid");
    const [lineCap, setLineCap] = useState("round");
    const [lineJoin, setLineJoin] = useState("round");
    const [opacity, setOpacity] = useState(1);
    const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [users, setUsers] = useState({});
    const [selectedTool, setSelectedTool] = useState("Pencil");
    const [textInput, setTextInput] = useState("");
    const [textFont, setTextFont] = useState("Arial");
    const [textSize, setTextSize] = useState(16);
    const [userCursors, setUserCursors] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const [selectedTab, setSelectedTab] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [drawerExpanded, setDrawerExpanded] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [gridSize, setGridSize] = useState(20);
    const [gridColor, setGridColor] = useState("#ccc");
    const [cursorStyle, setCursorStyle] = useState("default");
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const pdfExportComponent = useRef(null); // Ref for PDF export
    const startPointRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            contextRef.current = canvas.getContext('2d');
            contextRef.current.fillStyle = darkMode ? "#333" : "#f8f9fa";
            contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [darkMode]);

    useEffect(() => {
        const handleDraw = ({ prevX, prevY, currentX, currentY, color, size, style, opacity }) => {
            if (contextRef.current) {
                contextRef.current.strokeStyle = color;
                contextRef.current.lineWidth = size;
                contextRef.current.globalAlpha = opacity;
                contextRef.current.setLineDash(style === "dashed" ? [10, 5] : style === "dotted" ? [2, 5] : []);
                contextRef.current.beginPath();
                contextRef.current.moveTo(prevX, prevY);
                contextRef.current.lineTo(currentX, currentY);
                contextRef.current.stroke();
            }
        };

        socket.on("connect", () => {
            console.log("Connected to server with ID:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        socket.on("draw", handleDraw);

        socket.on("updateUsers", (activeUsers) => {
            setUsers(activeUsers);
        });

        socket.on("cursorMove", (cursorData) => {
            setUserCursors((prevCursors) => ({
                ...prevCursors,
                [cursorData.userId]: cursorData,
            }));
        });

        socket.on("typing", ({ userId, isTyping }) => {
            setTypingUsers((prev) => ({
                ...prev,
                [userId]: isTyping,
            }));
        });

        socket.on("userJoined", (userName) => {
            new Audio("/notification.mp3").play();
            setNotifications((prev) => [...prev, `${userName} has joined the board!`]);
        });

        socket.on("chatMessage", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socket.off("draw", handleDraw);
            socket.off("updateUsers", setUsers);
            socket.off("cursorMove");
            socket.off("typing");
            socket.off("userJoined");
            socket.off("chatMessage");
        };
    }, []);

    const startDrawing = useCallback(({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        setIsDrawing(true);
        startPointRef.current = { x: offsetX, y: offsetY };
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
    }, []);

    const draw = useCallback(({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        const startX = startPointRef.current.x;
        const startY = startPointRef.current.y;

        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        contextRef.current.strokeStyle = strokeColor;
        contextRef.current.fillStyle = fillColor;
        contextRef.current.lineWidth = brushSize;
        contextRef.current.globalAlpha = opacity;
        contextRef.current.setLineDash(brushStyle === "dashed" ? [10, 5] : brushStyle === "dotted" ? [2, 5] : []);
        contextRef.current.lineCap = lineCap;
        contextRef.current.lineJoin = lineJoin;

        switch (selectedTool) {
            case "Rectangle":
                contextRef.current.strokeRect(startX, startY, offsetX - startX, offsetY - startY);
                if (fillColor !== "transparent") {
                    contextRef.current.fillRect(startX, startY, offsetX - startX, offsetY - startY);
                }
                break;
            case "Circle":
                const radius = Math.sqrt(Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2));
                contextRef.current.beginPath();
                contextRef.current.arc(startX, startY, radius, 0, 2 * Math.PI);
                contextRef.current.stroke();
                if (fillColor !== "transparent") {
                    contextRef.current.fill();
                }
                break;
            case "Triangle":
                contextRef.current.beginPath();
                contextRef.current.moveTo(startX, startY);
                contextRef.current.lineTo(offsetX, offsetY);
                contextRef.current.lineTo(startX * 2 - offsetX, offsetY);
                contextRef.current.closePath();
                contextRef.current.stroke();
                if (fillColor !== "transparent") {
                    contextRef.current.fill();
                }
                break;
            case "Star":
                drawStar(contextRef.current, startX, startY, 5, 30, 15);
                if (fillColor !== "transparent") {
                    contextRef.current.fill();
                }
                break;
            case "Polygon":
                drawPolygon(contextRef.current, startX, startY, 6, 50);
                if (fillColor !== "transparent") {
                    contextRef.current.fill();
                }
                break;
            case "Ellipse":
                contextRef.current.beginPath();
                contextRef.current.ellipse(startX, startY, Math.abs(offsetX - startX), Math.abs(offsetY - startY), 0, 0, 2 * Math.PI);
                contextRef.current.stroke();
                if (fillColor !== "transparent") {
                    contextRef.current.fill();
                }
                break;
            default:
                contextRef.current.lineTo(offsetX, offsetY);
                contextRef.current.stroke();
                break;
        }
    }, [isDrawing, strokeColor, fillColor, brushSize, brushStyle, opacity, lineCap, lineJoin, selectedTool]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
        contextRef.current.closePath();
    }, []);

    const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
        let rot = (Math.PI / 2) * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.stroke();
    };

    const drawPolygon = (ctx, cx, cy, sides, radius) => {
        ctx.beginPath();
        ctx.moveTo(cx + radius * Math.cos(0), cy + radius * Math.sin(0));
        for (let i = 1; i <= sides; i++) {
            ctx.lineTo(cx + radius * Math.cos((i * 2 * Math.PI) / sides), cy + radius * Math.sin((i * 2 * Math.PI) / sides));
        }
        ctx.closePath();
        ctx.stroke();
    };

    const addText = useCallback(() => {
        if (contextRef.current && textInput.trim()) {
            contextRef.current.font = `${textSize}px ${textFont}`;
            contextRef.current.fillStyle = strokeColor;
            contextRef.current.fillText(textInput, 50, 50); // Adjust position as needed
            setTextInput("");
        }
    }, [textInput, strokeColor, textFont, textSize]);

    const erase = useCallback(({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.clearRect(offsetX - brushSize / 2, offsetY - brushSize / 2, brushSize, brushSize);
    }, [brushSize]);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        const imageData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => [...prev, imageData]);
        setRedoStack([]); // Clear redo stack on new action
    }, []);

    const undo = useCallback(() => {
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            contextRef.current.putImageData(lastState, 0, 0);
            setHistory((prev) => prev.slice(0, -1));
            setRedoStack((prev) => [...prev, lastState]);
        }
    }, [history]);

    const redo = useCallback(() => {
        if (redoStack.length > 0) {
            const nextState = redoStack[redoStack.length - 1];
            contextRef.current.putImageData(nextState, 0, 0);
            setRedoStack((prev) => prev.slice(0, -1));
            setHistory((prev) => [...prev, nextState]);
        }
    }, [redoStack]);

    const exportWhiteboard = useCallback(() => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "whiteboard.png";
        link.click();
    }, []);

    const exportAsSVG = useCallback(() => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL("image/svg+xml");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "whiteboard.svg";
        link.click();
    }, []);

    const exportAsPDF = useCallback(() => {
        if (pdfExportComponent.current) {
            pdfExportComponent.current.save();
        }
    }, []);

    const sendMessage = useCallback((message) => {
        socket.emit("chatMessage", message);
        setMessages((prev) => [...prev, message]);
    }, []);

    const steps = [
        { label: "Start" },
        { label: "Draw" },
        { label: "Collaborate" },
        { label: "Finish" },
    ];

    return (
        <div className={`whiteboard-container ${darkMode ? "dark-mode" : ""}`}>
            <AppBar>
                <AppBarSection>
                    <h3>Whiteboard</h3>
                </AppBarSection>
                <AppBarSpacer />
                <AppBarSection>
                    <Button onClick={() => setDarkMode((prev) => !prev)}>
                        Toggle Dark Mode
                    </Button>
                    <Button onClick={undo}>Undo</Button>
                    <Button onClick={redo}>Redo</Button>
                    <Button onClick={exportWhiteboard}>Export as PNG</Button>
                    <Button onClick={exportAsSVG}>Export as SVG</Button>
                    <Button onClick={exportAsPDF}>Export as PDF</Button>
                    {Object.keys(users).map(userId => (
                        <Avatar key={userId} style={{ backgroundColor: users[userId]?.color || "gray" }}>
                            {users[userId]?.initials || "?"}
                        </Avatar>
                    ))}
                </AppBarSection>
            </AppBar>

            {notifications.map((note, index) => (
                <Notification key={index} type={{ style: "info", icon: true }}>{note}</Notification>
            ))}

            <Drawer expanded={drawerExpanded} position="start" mode="push" onOverlayClick={() => setDrawerExpanded(false)}>
                <DrawerContent>
                    <DrawerItem text="Tools" />
                    <DrawerItem text="Settings" />
                    <DrawerItem text="Export" />
                </DrawerContent>
            </Drawer>

            <TileLayout
                columns={3}
                rowHeight={60}
                gap={{ rows: 10, columns: 10 }}
                items={[
                    { header: "Tools", body: (
                        <DropDownList data={tools} value={selectedTool} onChange={(e) => setSelectedTool(e.value)} />
                    )},
                    { header: "Color", body: (
                        <ColorPicker value={strokeColor} onChange={(e) => setStrokeColor(e.value)} />
                    )},
                    { header: "Fill Color", body: (
                        <ColorPicker value={fillColor} onChange={(e) => setFillColor(e.value)} />
                    )},
                    { header: "Gradient", body: (
                        <DropDownList data={gradients} value={gradientType} onChange={(e) => setGradientType(e.value)} />
                    )},
                    { header: "Pattern", body: (
                        <DropDownList data={patterns} value={patternType} onChange={(e) => setPatternType(e.value)} />
                    )},
                    { header: "Brush Size", body: (
                        <NumericTextBox value={brushSize} onChange={(e) => setBrushSize(e.value)} min={1} max={10} />
                    )},
                    { header: "Brush Style", body: (
                        <DropDownList data={brushStyles} value={brushStyle} onChange={(e) => setBrushStyle(e.value)} />
                    )},
                    { header: "Line Cap", body: (
                        <DropDownList data={lineCaps} value={lineCap} onChange={(e) => setLineCap(e.value)} />
                    )},
                    { header: "Line Join", body: (
                        <DropDownList data={lineJoins} value={lineJoin} onChange={(e) => setLineJoin(e.value)} />
                    )},
                    { header: "Opacity", body: (
                        <Slider value={opacity} onChange={(e) => setOpacity(e.value)} min={0.1} max={1} step={0.1} />
                    )},
                    { header: "Text", body: (
                        <div>
                            <Input placeholder="Add text..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                            <DropDownList data={fonts} value={textFont} onChange={(e) => setTextFont(e.value)} />
                            <NumericTextBox value={textSize} onChange={(e) => setTextSize(e.value)} min={10} max={50} />
                            <Button onClick={addText}>Add Text</Button>
                        </div>
                    )},
                    { header: "Grid", body: (
                        <div>
                            <Button onClick={() => setShowGrid((prev) => !prev)}>
                                {showGrid ? "Hide Grid" : "Show Grid"}
                            </Button>
                            <Button onClick={() => setSnapToGrid((prev) => !prev)}>
                                {snapToGrid ? "Disable Snap" : "Enable Snap"}
                            </Button>
                            <NumericTextBox value={gridSize} onChange={(e) => setGridSize(e.value)} min={10} max={50} />
                            <ColorPicker value={gridColor} onChange={(e) => setGridColor(e.value)} />
                        </div>
                    )},
                    { header: "Cursor", body: (
                        <DropDownList data={cursors} value={cursorStyle} onChange={(e) => setCursorStyle(e.value)} />
                    )}
                ]}
            />

            <TabStrip selected={selectedTab} onSelect={(e) => setSelectedTab(e.selected)}>
                <TabStripTab title="Draw">
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        style={{ border: '1px solid black', background: darkMode ? '#222' : '#f8f9fa', borderRadius: '8px', cursor: cursorStyle }}
                        onMouseDown={selectedTool === "Eraser" ? erase : startDrawing}
                        onMouseMove={selectedTool === "Eraser" ? erase : draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                </TabStripTab>
                <TabStripTab title="Collaboration">
                    <Chat messages={messages} onMessageSend={sendMessage} />
                </TabStripTab>
                <TabStripTab title="Analytics">
                    <Chart>
                        <ChartSeries>
                            <ChartSeriesItem type="line" data={[10, 20, 30, 40]} />
                        </ChartSeries>
                    </Chart>
                </TabStripTab>
            </TabStrip>

            <Stepper value={activeStep} onChange={(e) => setActiveStep(e.value)} items={steps} />

            <Tooltip anchorElement="target" position="right">
                <Button onClick={() => setDrawerExpanded((prev) => !prev)}>Toggle Drawer</Button>
            </Tooltip>

            {isLoading && <Loader />}

            {/* PDF Export Component */}
            <PDFExport ref={pdfExportComponent} paperSize="A4" margin={0}>
                <div style={{ padding: "20px" }}>
                    <h1>Whiteboard Export</h1>
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        style={{ border: '1px solid black', background: darkMode ? '#222' : '#f8f9fa', borderRadius: '8px' }}
                    />
                </div>
            </PDFExport>
        </div>
    );
};

export default Whiteboard;