import './App.scss';
import React, { useState } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Grid, GridColumn, GridToolbar } from "@progress/kendo-react-grid";
import { Dialog } from "@progress/kendo-react-dialogs";
import { Card, CardHeader, CardBody, TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import { Chart, ChartSeries, ChartSeriesItem } from "@progress/kendo-react-charts";
import { Scheduler } from "@progress/kendo-react-scheduler";
import { Notification } from "@progress/kendo-react-notification";
import { Editor, EditorTools } from "@progress/kendo-react-editor";
import { Upload } from "@progress/kendo-react-upload";
import { Gantt } from "@progress/kendo-react-gantt";
import { filterBy } from "@progress/kendo-data-query";
import "@progress/kendo-theme-default/dist/all.css";
import "./custom-theme.css";

const ResumePortfolioBuilder = () => {
  const [resumeData, setResumeData] = useState([
    { id: 1, section: "Experience", content: "Software Engineer at XYZ Corp" },
    { id: 2, section: "Education", content: "BSc in Computer Science" },
  ]);
  const [showDialog, setShowDialog] = useState(false);
  const [newEntry, setNewEntry] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [filter, setFilter] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  
  const ganttData = [
    { id: 1, title: "Project Start", start: new Date("2025-03-01"), end: new Date("2025-03-10"), percentComplete: 100 },
    { id: 2, title: "Development Phase", start: new Date("2025-03-11"), end: new Date("2025-04-15"), percentComplete: 60 },
  ];

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      setResumeData([...resumeData, { id: resumeData.length + 1, section: "Custom", content: newEntry }]);
      setNewEntry("");
      setShowDialog(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const suggestAIEntry = () => {
    const aiSuggestions = [
      "Developed a scalable e-commerce platform using React and Node.js.",
      "Implemented machine learning models for fraud detection.",
      "Designed and optimized databases for high-traffic applications.",
      "Created an AI chatbot to automate customer support.",
      "Led a team in developing a mobile-first web application."
    ];
    const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
    setNewEntry(randomSuggestion);
  };

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}> 
      <h1 className="app-title">AI-Powered Resume & Portfolio Builder</h1>
      
      <Button onClick={() => setDarkMode(!darkMode)} className="styled-button">
        {darkMode ? "Light Mode" : "Dark Mode"}
      </Button>

      <TabStrip selected={selectedTab} onSelect={(e) => setSelectedTab(e.selected)} className="styled-tabstrip">
        <TabStripTab title="Resume">
          <Grid
            data={filter ? filterBy(resumeData, filter) : resumeData}
            filterable
            filter={filter}
            onFilterChange={(e) => setFilter(e.filter)}
            className="styled-grid"
          >
            <GridToolbar>
              <Button onClick={() => setShowDialog(true)} primary className="styled-button">Add New Entry</Button>
            </GridToolbar>
            <GridColumn field="section" title="Section" width="150px" />
            <GridColumn field="content" title="Content" />
          </Grid>
        </TabStripTab>
        <TabStripTab title="Portfolio">
          <Card className="styled-card">
            <CardHeader>Project 1</CardHeader>
            <CardBody>Built a React app with AI-powered features.</CardBody>
          </Card>
          <h3>Upload Certificates & Portfolio Projects</h3>
          <Upload
            batch={false}
            multiple={true}
            files={files}
            onAdd={(event) => setFiles(event.newState)}
            className="styled-upload"
          />
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </TabStripTab>
        <TabStripTab title="Skills Chart">
          <Chart className="styled-chart">
            <ChartSeries>
              <ChartSeriesItem type="bar" data={[{ category: "React", value: 80 }, { category: "AI", value: 70 }]} />
            </ChartSeries>
          </Chart>
        </TabStripTab>
        <TabStripTab title="Scheduler">
          <Scheduler className="styled-scheduler" />
        </TabStripTab>
        <TabStripTab title="Gantt Chart">
          <Gantt data={ganttData} className="styled-gantt" columns={[{ field: "title", title: "Task", width: "200px" }]} />
        </TabStripTab>
      </TabStrip>

      {showDialog && (
        <Dialog title="Add Resume Entry" onClose={() => setShowDialog(false)} className="styled-dialog">
          <div className="dialog-content">
            <Editor
              defaultContent={newEntry}
              onChange={(e) => setNewEntry(e.value)}
              tools={[
                [EditorTools.Bold, EditorTools.Italic, EditorTools.Underline],
                [EditorTools.Undo, EditorTools.Redo],
                [EditorTools.OrderedList, EditorTools.UnorderedList],
              ]}
              className="styled-editor"
            />
            <div className="button-group">
              <Button onClick={suggestAIEntry} className="styled-button">Suggest AI Entry</Button>
              <Button onClick={handleAddEntry} primary className="styled-button">Save</Button>
            </div>
          </div>
        </Dialog>
      )}

      {showNotification && (
        <Notification type={{ style: "success", icon: true }}>
          Resume entry added successfully!
        </Notification>
      )}
    </div>
  );
};

export default ResumePortfolioBuilder;




