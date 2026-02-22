# ScriptED 🚀

**ScriptED** is an interactive knowledge management platform featuring a dynamic tree-based node system for organizing and editing notebook-style content. Built with Next.js, TypeScript, and Framer Motion.

---

## ✨ Features

### 🌳 Interactive Node Tree Visualization
- **Unlimited Nodes**: Create as many nodes as you need - no 10-node limit
- **Gitflow-Style Branching**: Parent-child relationships with visual tree branching
- **Drag-and-Drop**: Move nodes anywhere on the canvas with smooth animations
- **Dynamic Add/Remove**: Hover over nodes to add children or remove nodes
- **Node Relinking**: Change parent-child relationships by relinking nodes
- **Recycle Bin**: Recover accidentally deleted nodes
- **Zoom & Pan Controls**: 
  - Zoom in/out with dedicated controls or Ctrl+Scroll
  - Pan the canvas with Shift+Drag or Alt+Drag
  - Fit to View - automatically frames all nodes
  - Reset View - returns to default zoom and position
  - Real-time zoom percentage display
- **Zoom & Pan Controls**: 
  - Zoom in/out with dedicated buttons or Ctrl+Scroll
  - Pan the canvas with Shift+Drag or Middle-click drag
  - "Fit to View" automatically frames all nodes
  - "Reset View" returns to 100% zoom and center position
  - Visual zoom percentage indicator

### 📓 Multi-Page Notebook Editor
- **Rich Text Editing**: Full-featured notebook for each node
- **Multiple Pages**: Add unlimited pages per notebook
- **Emoji Stickers**: Drag-and-drop emoji stickers on pages
- **Auto-Save**: Content automatically saves every 500ms
- **Node Context**: Each node has its own isolated notebook content

### 📂 Project Management
- **Multiple Projects**: Create and manage unlimited projects
- **Search & Filter**: Find projects instantly with real-time search
- **Sort Options**: Sort by recent, name, or creation date
- **Favorites**: Mark important projects for quick access
- **Project Cards**: Beautiful card-based project grid layout

### 🎨 Modern UI/UX
- **Purple Gradient Theme**: Cohesive purple color palette (#cfaad8 → #934acb → #48229a → #dd00ee)
- **Breadcrumb Navigation**: Always know where you are in the app
- **Responsive Sidebar**: Recent projects and favorites at your fingertips
- **Animated Transitions**: Smooth Framer Motion animations throughout
- **Loading States**: Beautiful loading screens during navigation

### 🔐 Authentication System
- **User Signup/Login**: Secure authentication with session management
- **User Profiles**: Personalized user dropdown with avatar
- **Session Cookies**: HTTP-only cookies for security
- **Protected Routes**: Automatic redirects for unauthenticated users
- **Logout Functionality**: Clean session termination

### 💾 Data Persistence
- **LocalStorage Database**: Complete CRUD operations using localStorage
- **Project Context**: Global state management with React Context
- **Node Relationships**: Parent-child tracking with depth calculation
- **Auto-Initialization**: Sample project created on first launch

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd scripted

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📖 Usage Guide

### 1. Authentication
- Visit the homepage at `http://localhost:3000`
- Click **"Get Started"** to create an account
- Or click **"Log in"** if you already have an account
- After login, you'll be redirected to the Dashboard

### 2. Creating Projects
1. Navigate to the **Dashboard**
2. Click the **"+ New Project"** button
3. EnNavigation Controls** (bottom-right):
   - 🔍 **Zoom In/Out** - Use buttons or Ctrl+Scroll
   - 📐 **Fit to View** - Auto-frames all nodes in viewport
   - 🏠 **Reset View** - Returns to default zoom (100%)
   - **Pan** - Hold Shift and drag, or use middle mouse button
4. **Node Actions** - Hover over any node to see:
   - **+** (Green) - Add a child node
   - **×** (Red) - Remove node and its children
   - **🔗** (Blue) - Relink to a different parent
5. **Click** a node to open its notebook
6. You'll see the **Tree View** with a root node in the center
3. **Hover** over any node to see action buttons:
   - **+** (Green) - Add a child node
   - **×** (Red) - Remove node and its children
   - **🔗** (Blue) - Relink to a different parent
4. **Click** a node to open its notebook
5. **Drag** nodes to reposition them on the canvas
6. **Navigate the tree**:
   - **Shift + Drag** - Pan around the canvas
   - **Ctrl/Cmd + Scroll** - Zoom in/out
   - **Zoom buttons** - Manual zoom controls (bottom-right)
   - **Fit to View** - Auto-fit all nodes in viewport
   - **Reset View** - Return to 100% zoom

### 4. Editing Notebooks
1. Click any node to open its notebook
2. Type content in the text area
3. Add new pages using the **"+ Add Page"** button
4. Add emoji stickers from the palette
5. Content auto-saves - click **"Back to Tree"** when done

### 5. Managing Projects
- **Search**: Use the search bar in Dashboard to filter projects
- **Sort**: Choose between Recent, Name, or Creation Date
- **Favorites**: Click the star icon to mark projects as favorites
- **Delete**: Click trash icon to remove projects (with confirmation)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1.6** - React framework with App Router
- **React 19** - UI library with hooks and context
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library

### Backend (Unused - LocalStorage Only)
- **SQLite3** - Database setup (available but not used)
- **API Routes** - Authentication endpoints

### State Management
- **React Context** - Global app state
- **LocalStorage** - Client-side data persistence

---

## 📁 Project Structure

```
scripted/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── dashboard/           # Projects dashboard
│   ├── project/[id]/        # Dynamic project routes
│   │   ├── tree/            # Node tree visualization
│   │   └── notebook/        # Notebook editor
│   ├── navbar/              # Navigation bar component
│   └── api/                 # API routes (auth)
├── components/              # Reusable components
│   ├── sidebar.tsx          # Sidebar navigation
│   ├── login-form.tsx       # Login form
│   ├── signup-form.tsx      # Signup form
│   └── ui/                  # UI primitives
├── lib/                     # Utility libraries
│   ├── localDb.ts          # LocalStorage database
│   ├── AppContext.tsx      # React Context provider
│   └── utils.ts            # Helper functions
├── database/                # Backend database (unused)
└── public/                  # Static assets
```
Ctrl/Cmd + Scroll** - Zoom in/out on tree canvas
- **Shift + Drag** - Pan around the tree canvas
- **Alt + Drag** - Alternative pan mode
- **ESC** - Cancel node linking mode / Close modals
- **Middle Mouse Button** - Pan the canva
---

## 🎯 Keyboard Shortcuts

- **Ctrl/Cmd + K** - Open "Create New Project" modal (Dashboard)
- **ESC** - Cancel node linking mode / Close modals
- **Click Outside** - Close dropdowns/modals

---

## 🔑 Key Components

### LocalDB (lib/localDb.ts)
Complete localStorage abstraction with:
- Project CRUD operations
- Node management
- Search and filtering
- Favorites and recents

### AppContext (lib/AppContext.tsx)
Global state provider:
- Current user
- Current project
- Current node ID
- Refresh trigger

### Tree View (app/main/page.tsx)
Interactive canvas featuring:
- Node positioning algorithm
- Parent-child line rendering
- Drag-and-drop handlers
- Link/relink logic

### Notebook (app/notebook/page.tsx)
Multi-page editor with:
- Auto-saving content
- Page management
- Sticker placement
- Text area auto-expansion

---

## 🎨 Color Palette

```css
Primary Gradient:
  #cfaad8 → #934acb → #48229a → #dd00ee

Accent Colors:
  Blue: #3b82f6
  Green: #10b981
  Red: #ef4444
  Purple variants: #b794f4, #9f7aea, #805ad5
```

---

## 🚧 Future Enhancements

- [ ] Real-time collaboration
- [ ] Export to PDF/Markdown
- [ ] Node templates
- [ ] Tags and metadata
- [ ] Advanced search
- [ ] Dark mode
- [ ] Mobile responsive improvements
- [ ] Keyboard navigation
- [ ] Undo/Redo functionality
- [ ] Cloud sync options

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

## 👨‍💻 Author

Built with ❤️ for organizing knowledge in a visual, intuitive way.

---

## 📞 Support

For issues or questions, please open an issue on GitHub.

