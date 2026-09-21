# 🎨 Canvas Workspace

### A modern, cloud-synchronized canvas for drawing, designing, and bringing ideas to life.

Canvas Workspace is a browser-based 2D vector canvas designed to make visual thinking simple, intuitive, and accessible. Built with React, Fabric.js, and Firebase Firestore, it combines the flexibility of an infinite whiteboard with the structure of an A4 document editor.

From sketching ideas and arranging shapes to working with images and organizing visual concepts, Canvas Workspace provides an interactive environment where your work stays saved and accessible through a unique workspace URL.

The project brings together a modern SaaS-inspired interface, practical canvas editing tools, flexible workspace layouts, and cloud-backed persistence in one application.

---

## ✨ Highlights

* **Interactive 2D Canvas:** Draw, sketch, insert shapes, upload images, and manipulate objects using Fabric.js.
* **Infinite & A4 Workspaces:** Switch between an open-ended canvas and structured A4 paper layouts.
* **Cloud Autosave:** Automatically save canvas changes to Firebase Firestore with a debounced synchronization workflow.
* **Shareable Workspace URLs:** Create workspaces with unique Firestore document IDs and access them through dedicated routes.
* **Floating Tool Dock:** Keep essential editing tools within easy reach through a compact, glassmorphism-inspired interface.
* **Flexible Styling:** Customize fill and border colors independently for selected objects and new creations.
* **Object Manipulation:** Select, move, rotate, scale, duplicate, and delete canvas elements.
* **Keyboard Shortcuts:** Use familiar copy-and-paste shortcuts to duplicate objects efficiently.
* **AI Diagram Generation (Beta):** An experimental feature exploring prompt-driven diagram creation.

---

## 🖥️ The Experience

Canvas Workspace is designed around a simple idea: your workspace should feel powerful without becoming cluttered.

The interface combines a clean landing page with a focused editing environment. A floating toolbar keeps frequently used tools accessible, while workspace settings and export controls are organized in the top header.

### Landing Page

The landing page introduces the application through a modern SaaS-inspired design, featuring ambient 3D-style floating orbs, glassmorphic cards, and subtle interactive tilt effects.

Starting a new workspace is straightforward: initialize a canvas, generate its unique identifier, and navigate directly to the editor.

### Canvas Editor

The editor provides an interactive environment for creating and manipulating visual content. Its tool dock brings drawing, shape insertion, styling, and history controls together in a compact interface.

The canvas supports both freeform creative work and more structured document layouts.

---

## 🚀 Features

### 1. Drawing & Sketching

Create freehand vector artwork directly on the canvas.

* **Pen Tool:** Draw smooth, freehand vector paths.
* **Highlighter Tool:** Emphasize important areas using adjustable brush sizing.
* **Eraser Tool:** Remove unwanted paths and canvas objects.
* **Image Upload:** Add local images through file upload or drag-and-drop interactions.

The drawing tools are designed to support quick sketches, annotations, and visual exploration without interrupting the creative workflow.

### 2. Shapes & Object Editing

Create and customize visual elements using an object-oriented canvas editing experience.

* Insert supported shapes into the workspace.
* Select individual objects or multiple elements together.
* Move, rotate, and scale selected objects.
* Delete unwanted elements.
* Copy and paste objects using `Ctrl+C` and `Ctrl+V`.
* Automatically stagger duplicated objects to make pasted copies easier to identify.

Fabric.js provides the underlying canvas object model, making it possible to manipulate individual elements rather than treating the entire canvas as a single image.

### 3. Independent Fill & Border Colors

Customize the appearance of canvas objects using separate fill and stroke controls.

* **Fill Color:** Change the interior color of supported objects.
* **Border Color:** Customize the outline independently.
* **Live Updates:** Apply color changes to selected elements or use them as styling defaults for newly created objects.

This separation makes it easier to create visual contrast, emphasize important elements, and maintain consistent styling throughout a workspace.

### 4. Flexible Workspace Modes

Choose a workspace that fits the task at hand.

| Workspace                   | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| Full-screen infinite canvas | An open-ended workspace for brainstorming and freeform drawing. |
| A4 document                 | A structured, bounded workspace for document-oriented layouts.  |

#### Infinite Canvas Backgrounds

The full-screen workspace offers three background options:

* Dot Grid
* Line Grid
* Plain White

These options provide different visual references for drawing, planning, and organizing ideas.

#### A4 Paper Layouts

Switch to a physical-document-style A4 workspace with explicit boundaries.

Available layouts include:

* Blank
* Ruled
* Grid

The A4 mode is intended for more structured work, while the infinite canvas offers greater flexibility for open-ended projects.

### 5. Cloud Autosave & Persistence

Canvas Workspace uses Firebase Firestore to persist workspace data.

The autosave system is built around a **700 ms debounced save workflow**, reducing unnecessary database writes while the user is actively editing.

#### How synchronization works

1. The user creates or modifies canvas content.
2. Canvas changes are serialized into a JSON scene representation.
3. A debounced save operation writes the serialized scene to Firestore.
4. The editor displays the current synchronization status.

The interface provides three save states:

* `Saved`
* `Saving...`
* `Error`

The canvas scene is stored as a single serialized JSON string within a Firestore document. This keeps the persistence model straightforward and allows the application to restore the saved scene when its workspace is opened again.

### 6. Unique Workspace URLs

Each newly initialized workspace receives a unique Firestore document ID.

The application uses React Router to navigate to a dedicated editor route:

`/canvas/:canvasId`

This allows a workspace to be reopened using its URL, subject to the application's Firestore access rules.

The current implementation is designed around individual workspaces rather than a full multi-user collaboration system.

### 7. Modern UI & Interaction Design

The interface combines a modern visual style with practical editing controls.

Key UI elements include:

* Glassmorphism-inspired surfaces and floating cards.
* Ambient 3D-style visual effects on the landing page.
* Subtle interactive tilt motion.
* A floating pill-shaped tool dock.
* Custom CSS hover tooltips for individual tools.
* A top header for workspace settings and export controls.

The goal is to keep essential actions discoverable while preserving as much screen space as possible for the canvas itself.

---

## 🧪 Experimental Features

### AI Text-to-Diagram Generator — Beta

The AI diagram generator is currently in active development and testing.

The feature explores how natural-language prompts could be transformed into visual diagram layouts within the canvas workspace.

Current development areas include:

* Prompt-to-visual generation workflows.
* Token streaming.
* Automated layout creation and element placement.
* Integration with the existing canvas editing experience.

**Status:** Experimental. The feature is not yet presented as a fully completed, production-ready diagram generation system.

---

## 🛠️ Tech Stack

Canvas Workspace is built using a modern JavaScript frontend stack with Firebase-powered persistence.

| Technology         | Role                                                        |
| ------------------ | ----------------------------------------------------------- |
| React 18           | Component-based frontend and UI development                 |
| Vite               | Development server and frontend build tooling               |
| Fabric.js          | Interactive 2D canvas rendering and object manipulation     |
| Firebase Firestore | Cloud storage for serialized canvas scenes                  |
| React Router v6    | Client-side routing and workspace navigation                |
| Custom CSS         | Glassmorphism, layout styling, tooltips, and visual effects |

---

## 🏗️ Project Architecture

The application is organized into pages, reusable components, canvas history logic, and Firebase configuration.

```text
src/
├── pages/
│   ├── Home.jsx
│   └── CanvasEditor.jsx
│
├── components/
│   └── Toolbar.jsx
│
├── hooks/
│   └── useCanvasHistory.js
│
├── lib/
│   └── firebase.js
│
└── App.jsx
```

### Core Components

| File                  | Responsibility                                                                        |
| --------------------- | ------------------------------------------------------------------------------------- |
| `Home.jsx`            | Landing page, workspace initialization, and navigation to a new canvas.               |
| `CanvasEditor.jsx`    | Main editor controller, canvas interactions, workspace modes, and keyboard shortcuts. |
| `Toolbar.jsx`         | Floating editing dock, drawing tools, shape controls, and color selectors.            |
| `useCanvasHistory.js` | Canvas snapshot history used for undo and redo functionality.                         |
| `firebase.js`         | Firebase configuration and Firestore database operations.                             |
| `App.jsx`             | Application routing, including the home page and individual canvas routes.            |

---

## ⚙️ Getting Started

Follow these steps to run Canvas Workspace locally.

### Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/) — a version compatible with your project's dependencies.
* npm — included with Node.js.
* A Firebase account with a configured project.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/canvas-editor.git

cd canvas-editor
```

Replace `your-username` with the appropriate GitHub username or repository owner.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project through the [Firebase Console](https://console.firebase.google.com/).

Register a Web App in your Firebase project and enable Cloud Firestore.

Create a `.env` file in the root directory of your project:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with the corresponding Firebase configuration values from your project.

**Important:** These environment variables configure the Firebase client. They do not replace Firestore Security Rules or server-side access controls.

### 4. Configure Firestore

Create a Cloud Firestore database in your Firebase project.

The application stores workspace data under the `canvases` collection.

For local development, configure Firestore Security Rules to match your application's intended access model.

The following is a simplified example for an authenticated-user setup, assuming each canvas document has an `ownerUid` field:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /canvases/{canvasId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.ownerUid;
    }
  }
}
```

Adapt the rules to your actual authentication and document-creation flow. This example is not a drop-in replacement if the current application does not implement Firebase Authentication or store an `ownerUid` field.

Avoid deploying unrestricted public read/write rules to production.

### 5. Start the Development Server

```bash
npm run dev
```

Vite will start the local development server. Open the local URL displayed in your terminal to access the application.

---

## 🔐 Security & Data Considerations

Canvas Workspace uses Firebase Firestore for cloud persistence, so access control is an important part of deployment.

A few things to keep in mind:

* Firebase client configuration values are not a substitute for database security.
* Firestore Security Rules should enforce the intended access permissions.
* Unique canvas IDs provide workspace addressing, not authorization.
* Publicly accessible workspace URLs should be designed with an explicit sharing and permission model.
* The current last-write-wins persistence approach is not a collaborative conflict-resolution system.

The application should be configured with security rules appropriate to its actual authentication, ownership, and sharing behavior before being deployed for real users.

---

## 🚧 Roadmap & Known Limitations

Canvas Workspace is an evolving project, with future development focused on expanding its editing capabilities and improving how people work together.

### Current Limitations

* **Single-user editing model:** The current architecture is designed around individual workspaces.
* **Last-write-wins persistence:** Concurrent edits are not coordinated through a collaborative conflict-resolution system.
* **Experimental AI generation:** The prompt-to-diagram feature is still being developed and tested.
* **Access control depends on configuration:** Workspace permissions must be enforced through appropriate Firebase Security Rules and application logic.

### Planned Improvements

* [ ] Complete and refine the AI text-to-diagram generation workflow.
* [ ] Improve automated layout placement and diagram editing.
* [ ] Introduce real-time multi-user collaboration.
* [ ] Explore WebSocket-based presence and synchronization.
* [ ] Investigate CRDT-based conflict resolution for concurrent editing.
* [ ] Expand workspace sharing and access management.
* [ ] Continue improving canvas performance and the overall editing experience.

These are planned areas of development, not claims of currently available functionality.

---

## 💡 Design Philosophy

Canvas Workspace is built around three core ideas:

**Keep creativity uninterrupted.** Essential tools should remain accessible without taking attention away from the canvas.

**Make visual work flexible.** Users should be able to move between open-ended brainstorming and structured document layouts.

**Keep work accessible.** Cloud-backed persistence and unique workspace URLs make it possible to return to saved work without relying solely on a local browser session.

The project explores how a focused, browser-based canvas can bring drawing, visual organization, and cloud persistence together in a single experience.

---

## 🤝 Contributing

Contributions, feedback, and ideas are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the functionality you have modified.
5. Open a pull request describing the changes.

For larger changes, opening an issue first can help align the implementation with the project's direction.

---

## 📄 License

Add the appropriate license information for your repository here.

If you plan to make Canvas Workspace open source, consider including a `LICENSE` file that clearly defines how others may use, modify, and distribute the project.

---

## 👨‍💻 Built With

Canvas Workspace is a project exploring interactive 2D editing, modern frontend development, and cloud-backed application architecture.

If you find the project interesting, feel free to explore the codebase, share feedback, or contribute to its ongoing development.

**Create a workspace. Explore your ideas. Bring them to the canvas.**
