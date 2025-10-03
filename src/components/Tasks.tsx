import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '../hooks/useDatabase';
import { User as UserType } from '../hooks/useAuth';

interface TasksProps {
  db: any;
  onSave: () => void;
  currentUser: UserType;
  getUsers: () => UserType[];
}

export const Tasks: React.FC<TasksProps> = ({ db, onSave, currentUser, getUsers }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    assigned_to: ''
  });
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    if (db) {
      initializeTasks();
      loadTasks();
      if (currentUser.role === 'admin') {
        setUsers(getUsers());
      }
    }
  }, [db, currentUser]);

  const initializeTasks = () => {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS tasks_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT FALSE,
          assigned_to INTEGER,
          assigned_by INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          due_date TEXT,
          FOREIGN KEY (assigned_to) REFERENCES users (id),
          FOREIGN KEY (assigned_by) REFERENCES users (id)
        )
      `);

      const existingTasks = db.exec('SELECT name FROM sqlite_master WHERE type="table" AND name="tasks"');
      if (existingTasks[0]?.values?.length > 0) {
        db.exec(`
          INSERT INTO tasks_new (id, title, description, completed, created_at, due_date)
          SELECT id, title, description, completed, created_at, due_date FROM tasks
        `);
        db.exec('DROP TABLE tasks');
      }

      db.exec('ALTER TABLE tasks_new RENAME TO tasks');
    } catch (error) {
      console.error('Error initializing tasks:', error);
    }
  };

  const loadTasks = () => {
    try {
      let query = `
        SELECT t.*, 
               u1.username as assigned_to_name,
               u2.username as assigned_by_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.assigned_by = u2.id
      `;

      if (currentUser.role !== 'admin') {
        query += ` WHERE t.assigned_to = ${currentUser.id} OR t.assigned_to IS NULL`;
      }

      query += ` ORDER BY t.completed ASC, t.created_at DESC`;

      const result = db.exec(query);

      if (result[0]?.values) {
        const tasksData = result[0].values.map((row: any) => ({
          id: row[0],
          title: row[1],
          description: row[2],
          completed: !!row[3],
          assigned_to: row[4],
          assigned_by: row[5],
          created_at: row[6],
          due_date: row[7],
          assigned_to_name: row[8],
          assigned_by_name: row[9]
        }));
        setTasks(tasksData);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser.role !== 'admin') {
      alert('Solo los administradores pueden crear tareas');
      return;
    }

    try {
      db.run(
        'INSERT INTO tasks (title, description, due_date, assigned_to, assigned_by) VALUES (?, ?, ?, ?, ?)',
        [
          formData.title,
          formData.description,
          formData.due_date || null,
          formData.assigned_to ? parseInt(formData.assigned_to) : null,
          currentUser.id
        ]
      );

      onSave();
      setFormData({ title: '', description: '', due_date: '', assigned_to: '' });
      setShowForm(false);
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error al guardar la tarea');
    }
  };

  const toggleTask = (id: number, completed: boolean) => {
    try {
      db.run('UPDATE tasks SET completed = ? WHERE id = ?', [!completed, id]);
      onSave();
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = (id: number) => {
    if (currentUser.role !== 'admin') {
      alert('Solo los administradores pueden eliminar tareas');
      return;
    }

    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      try {
        db.run('DELETE FROM tasks WHERE id = ?', [id]);
        onSave();
        loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const isAdmin = currentUser.role === 'admin';

  const renderAssignedInfo = (task: Task) => (
    <>
      {task.assigned_to_name && (
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <User className="w-3 h-3 mr-1" />
          <span>Asignado a: {task.assigned_to_name}</span>
        </div>
      )}
      {task.assigned_by_name && (
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <span>Por: {task.assigned_by_name}</span>
        </div>
      )}
    </>
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tareas</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isAdmin ? 'Gestiona y asigna tareas' : 'Revisa tus tareas asignadas'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Tarea</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Tareas Pendientes</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingTasks.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks.length}</p>
              </div>
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tasks.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <TaskList
          tasks={pendingTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          isAdmin={isAdmin}
          renderAssignedInfo={renderAssignedInfo}
          completed={false}
        />

        {/* Completed Tasks */}
        <TaskList
          tasks={completedTasks}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          isAdmin={isAdmin}
          renderAssignedInfo={renderAssignedInfo}
          completed={true}
        />
      </div>

      {/* Task Form Modal */}
      {showForm && isAdmin && (
        <TaskForm
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          setShowForm={setShowForm}
          users={users}
        />
      )}
    </div>
  );
};

// ---------- TaskList Component ----------
interface TaskListProps {
  tasks: Task[];
  toggleTask: (id: number, completed: boolean) => void;
  deleteTask: (id: number) => void;
  isAdmin: boolean;
  renderAssignedInfo: (task: Task) => JSX.Element;
  completed: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, toggleTask, deleteTask, isAdmin, renderAssignedInfo, completed }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-white">
        {completed ? (
          <Check className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
        ) : (
          <Clock className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
        )}
        {completed ? 'Tareas Completadas' : 'Tareas Pendientes'}
      </h2>
    </div>
    <div className="p-6">
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {completed ? (
            <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
          ) : (
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          )}
          <p>{completed ? 'No hay tareas completadas' : 'No hay tareas pendientes'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${
                completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3
                    className={`font-medium text-gray-900 dark:text-white mb-1 ${
                      completed ? 'line-through' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                  )}
                  {renderAssignedInfo(task)}
                  {task.due_date && (
                    <div className={`flex items-center text-xs ${completed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{completed ? 'Completada: ' : 'Vence: '}{format(new Date(task.due_date), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleTask(task.id, task.completed)}
                    className={`p-2 rounded-lg ${
                      completed
                        ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    {completed ? <Clock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Eliminar tarea"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ---------- TaskForm Component ----------
interface TaskFormProps {
  formData: typeof formData;
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  handleSubmit: (e: React.FormEvent) => void;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  users: UserType[];
}

const TaskForm: React.FC<TaskFormProps> = ({ formData, setFormData, handleSubmit, setShowForm, users }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Asignar Nueva Tarea</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (Opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asignar a Usuario</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Sin asignar</option>
              {users.filter(user => user.is_active).map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role === 'admin' ? 'Admin' : 'Usuario'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Vencimiento (Opcional)</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setFormData({ title: '', description: '', due_date: '', assigned_to: '' });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Asignar Tarea
          </button>
        </div>
      </form>
    </div>
  </div>
);
