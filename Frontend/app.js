// Base URL for API calls
const API_BASE_URL = 'https://sschool-dbie.onrender.com/api';

// Utility function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Always add Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const requestOptions = {
    ...options,
    headers,
  };

  return fetch(`${API_BASE_URL}${url}`, requestOptions);
}

// Authentication functions
async function handleLogin(e) {
  e.preventDefault();
  
  const loginBtn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('loginError');
  const successDiv = document.getElementById('loginSuccess');
  
  // Hide previous messages
  hideMessage(errorDiv);
  hideMessage(successDiv);
  
  // Disable button and show loading
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing In...';

  try {
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      showMessage(successDiv, 'Login successful! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'student-dashboard.html';
        }
      }, 1500);
    } else {
      showMessage(errorDiv, data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage(errorDiv, 'Network error. Please try again.');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

async function handleStudentRegister(e) {
  e.preventDefault();
  
  const registerBtn = document.getElementById('registerBtn');
  const errorDiv = document.getElementById('registerError');
  const successDiv = document.getElementById('registerSuccess');
  
  hideMessage(errorDiv);
  hideMessage(successDiv);
  
  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating Account...';

  try {
    const formData = new FormData(e.target);
    const registerData = Object.fromEntries(formData);

    const response = await fetch(`${API_BASE_URL}/students/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(successDiv, 'Student account created successfully! Redirecting to login...');
      e.target.reset();
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } else {
      showMessage(errorDiv, data.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage(errorDiv, 'Network error. Please try again.');
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Student Account';
  }
}

async function handleAdminRegister(e) {
  e.preventDefault();
  
  const registerBtn = document.getElementById('registerBtn');
  const errorDiv = document.getElementById('registerError');
  const successDiv = document.getElementById('registerSuccess');
  
  hideMessage(errorDiv);
  hideMessage(successDiv);
  
  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating Account...';

  try {
    const formData = new FormData(e.target);
    const registerData = Object.fromEntries(formData);
    registerData.role = 'admin'; // Set role as admin

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(successDiv, 'Admin account created successfully! Redirecting to login...');
      e.target.reset();
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } else {
      showMessage(errorDiv, data.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showMessage(errorDiv, 'Network error. Please try again.');
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create Admin Account';
  }
}

// Authentication check
function checkAuth(requiredRole = null) {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('currentUser');

  if (!token || !user) {
    window.location.href = 'index.html';
    return false;
  }

  try {
    const userData = JSON.parse(user);
    
    if (requiredRole && userData.role !== requiredRole) {
      // Redirect to appropriate dashboard
      if (userData.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'student-dashboard.html';
      }
      return false;
    }

    // Update user info in header
    updateUserInfo(userData);
    return true;
  } catch (error) {
    console.error('Error parsing user data:', error);
    logout();
    return false;
  }
}

function updateUserInfo(userData) {
  const userNameElement = document.getElementById('userName');
  const userAvatarElement = document.getElementById('userAvatar');
  
  if (userNameElement) {
    userNameElement.textContent = userData.name;
  }
  
  if (userAvatarElement) {
    userAvatarElement.textContent = userData.name.charAt(0).toUpperCase();
  }
}

function updateCurrentUser(newUserData) {
  localStorage.setItem('currentUser', JSON.stringify(newUserData));
  updateUserInfo(newUserData);
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// UI Helper functions
function showMessage(element, message) {
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

function hideMessage(element) {
  if (element) {
    element.style.display = 'none';
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Modal functionality
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Escape key to close modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }
});

// Student dashboard specific functions
async function loadProfile() {
  try {
    const response = await fetchWithAuth('/students/profile');
    const userData = await response.json();

    if (response.ok) {
      document.getElementById('profileName').value = userData.name || '';
      document.getElementById('profileEmail').value = userData.email || '';
      document.getElementById('profileCourse').value = userData.course || '';
      document.getElementById('profileStudentId').value = userData.studentId || '';
      document.getElementById('profileSemester').value = userData.semester || '';
      document.getElementById('profileFaculty').value = userData.faculty || '';
    } else {
      console.error('Error loading profile:', userData.error);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  try {
    const formData = new FormData(e.target);
    const updateData = Object.fromEntries(formData);

    const response = await fetchWithAuth('/students/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (response.ok) {
      updateCurrentUser(data.user);
      alert('Profile updated successfully!');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Network error. Please try again.');
  }
}

async function loadBooks() {
  try {
    const response = await fetchWithAuth('/books');
    const data = await response.json();

    if (response.ok && data.books && data.books.length > 0) {
      document.getElementById('booksList').innerHTML = createBooksTable(data.books, true);
    } else {
      document.getElementById('booksList').innerHTML = '<p>No books available</p>';
    }
  } catch (error) {
    console.error('Error loading books:', error);
    document.getElementById('booksList').innerHTML = '<p>Error loading books</p>';
  }
}

async function loadMaterials() {
  try {
    const response = await fetchWithAuth('/students/materials');
    const data = await response.json();

    if (response.ok && data.materials && data.materials.length > 0) {
      document.getElementById('materialsList').innerHTML = createMaterialsTable(data.materials);
    } else {
      document.getElementById('materialsList').innerHTML = '<p>No study materials found</p>';
    }
  } catch (error) {
    console.error('Error loading materials:', error);
    document.getElementById('materialsList').innerHTML = '<p>Error loading materials</p>';
  }
}

function showAddMaterialModal() {
  document.getElementById('addMaterialModal').style.display = 'block';
}

async function handleAddMaterial(e) {
  e.preventDefault();

  try {
    const formData = new FormData(e.target);
    const materialData = Object.fromEntries(formData);

    const response = await fetchWithAuth('/students/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal('addMaterialModal');
      loadMaterials();
      e.target.reset();
      alert('Material added successfully!');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error adding material:', error);
    alert('Network error. Please try again.');
  }
}

// Table creation functions
function createBooksTable(books, showAddedBy = false) {
  const addedByColumn = showAddedBy ? '<th>Added By</th>' : '';

  return `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Book Name</th>
            <th>Author</th>
            <th class="description">Description</th>
            ${addedByColumn}
          </tr>
        </thead>
        <tbody>
          ${books.map(book => `
            <tr>
              <td>${book.bookName}</td>
              <td>${book.author}</td>
              <td class="description">${book.description || 'No description available'}</td>
              ${showAddedBy ? `<td>${book.userId ? book.userId.name : 'System'}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function createMaterialsTable(materials) {
  return `
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Content Preview</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        ${materials.map(material => `
          <tr>
            <td>${material.title}</td>
            <td>${material.content.substring(0, 100)}${material.content.length > 100 ? '...' : ''}</td>
            <td>${new Date(material.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function createUsersTable(users, showActions = false) {
  const actionsColumn = showActions ? '<th>Actions</th>' : '';

  return `
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Faculty</th>
          <th>Joined</th>
          ${actionsColumn}
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role.toUpperCase()}</span></td>
            <td>${user.faculty || 'N/A'}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            ${showActions ? `
              <td>
                <div class="action-btns">
                  <button class="btn-sm btn-edit" onclick="editUser('${user._id}')">Edit</button>
                  <button class="btn-sm btn-delete" onclick="deleteUser('${user._id}', '${user.name}')">Delete</button>
                </div>
              </td>
            ` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Admin-specific functions
async function loadDashboardData() {
  try {
    const response = await fetchWithAuth('/admin/dashboard/stats');
    const data = await response.json();

    if (response.ok) {
      document.getElementById('totalUsers').textContent = data.totalUsers || 0;
      document.getElementById('totalStudents').textContent = data.totalStudents || 0;
      document.getElementById('totalAdmins').textContent = data.totalAdmins || 0;
      document.getElementById('totalBooks').textContent = data.totalBooks || 0;

      // Load recent users
      if (data.recentUsers && data.recentUsers.length > 0) {
        document.getElementById('recentUsers').innerHTML = createUsersTable(data.recentUsers, false);
      } else {
        document.getElementById('recentUsers').innerHTML = '<p>No users found</p>';
      }
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadUsers() {
  try {
    const response = await fetchWithAuth('/admin/users');
    const data = await response.json();

    if (response.ok && data.users && data.users.length > 0) {
      document.getElementById('usersList').innerHTML = createUsersTable(data.users, true);
    } else {
      document.getElementById('usersList').innerHTML = '<p>No users found</p>';
    }
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('usersList').innerHTML = '<p>Error loading users</p>';
  }
}

// Admin book management
async function loadAdminBooks() {
  try {
    const response = await fetchWithAuth('/admin/books');
    const data = await response.json();

    if (response.ok && data.books && data.books.length > 0) {
      document.getElementById('booksList').innerHTML = createAdminBooksTable(data.books);
    } else {
      document.getElementById('booksList').innerHTML = '<p>No books found</p>';
    }
  } catch (error) {
    console.error('Error loading books:', error);
    document.getElementById('booksList').innerHTML = '<p>Error loading books</p>';
  }
}

function createAdminBooksTable(books) {
  return `
    <table class="table">
      <thead>
        <tr>
          <th>Book Name</th>
          <th>Author</th>
          <th>Description</th>
          <th>Added By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${books.map(book => `
          <tr>
            <td>${book.bookName}</td>
            <td>${book.author}</td>
            <td>${book.description || 'No description'}</td>
            <td>${book.userId ? book.userId.name : 'System'}</td>
            <td>
              <div class="action-btns">
                <button class="btn-sm btn-delete" onclick="deleteBook('${book._id}', '${book.bookName}')">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function handleCreateAdmin(e) {
  e.preventDefault();

  try {
    const formData = new FormData(e.target);
    const adminData = Object.fromEntries(formData);

    const response = await fetchWithAuth('/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });

    const data = await response.json();

    if (response.ok) {
      e.target.reset();
      alert('Admin created successfully!');
      loadDashboardData();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error creating admin:', error);
    alert('Network error. Please try again.');
  }
}

function showAddBookModal() {
  document.getElementById('addBookModal').style.display = 'block';
}

async function handleAddBook(e) {
  e.preventDefault();

  try {
    const formData = new FormData(e.target);
    const bookData = Object.fromEntries(formData);

    const response = await fetchWithAuth('/admin/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal('addBookModal');
      loadAdminBooks();
      e.target.reset();
      alert('Book added successfully!');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error adding book:', error);
    alert('Network error. Please try again.');
  }
}

async function editUser(userId) {
  try {
    const response = await fetchWithAuth(`/admin/users/${userId}`);
    const userData = await response.json();

    if (response.ok) {
      document.getElementById('editUserId').value = userData._id;
      document.getElementById('editUserName').value = userData.name;
      document.getElementById('editUserEmail').value = userData.email;
      document.getElementById('editUserCourse').value = userData.course || '';
      document.getElementById('editUserFaculty').value = userData.faculty || '';
      document.getElementById('editUserRole').value = userData.role;
      document.getElementById('editUserStudentId').value = userData.studentId || '';

      document.getElementById('editUserModal').style.display = 'block';
    } else {
      alert('Error loading user data: ' + userData.error);
    }
  } catch (error) {
    console.error('Error loading user:', error);
    alert('Network error. Please try again.');
  }
}

async function handleEditUser(e) {
  e.preventDefault();

  try {
    const formData = new FormData(e.target);
    const updateData = Object.fromEntries(formData);
    const userId = document.getElementById('editUserId').value;
    delete updateData.userId;

    const response = await fetchWithAuth(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal('editUserModal');
      loadUsers();
      alert('User updated successfully!');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    alert('Network error. Please try again.');
  }
}

async function deleteUser(userId, userName) {
  if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
    try {
      const response = await fetchWithAuth(`/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        loadUsers();
        loadDashboardData();
        alert('User deleted successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Network error. Please try again.');
    }
  }
}

async function deleteBook(bookId, bookName) {
  if (confirm(`Are you sure you want to delete the book "${bookName}"? This action cannot be undone.`)) {
    try {
      const response = await fetchWithAuth(`/admin/books/${bookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        loadAdminBooks();
        loadDashboardData();
        alert('Book deleted successfully!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Network error. Please try again.');
    }
  }
}

// Student dashboard specific functions (enhanced)
async function loadStudentDashboardData() {
  try {
    // Load books count
    const booksResponse = await fetchWithAuth('/books');
    const booksData = await booksResponse.json();
    
    if (document.getElementById('totalBooks')) {
      document.getElementById('totalBooks').textContent = booksData.total || booksData.books?.length || 0;
    }

    // Load materials count
    const materialsResponse = await fetchWithAuth('/students/materials');
    const materialsData = await materialsResponse.json();
    
    if (document.getElementById('totalMaterials')) {
      document.getElementById('totalMaterials').textContent = materialsData.total || materialsData.materials?.length || 0;
    }

    // Load recent books
    if (booksData.books && booksData.books.length > 0) {
      const recentBooks = booksData.books.slice(0, 5);
      if (document.getElementById('recentBooks')) {
        document.getElementById('recentBooks').innerHTML = createBooksTable(recentBooks);
      }
    } else {
      if (document.getElementById('recentBooks')) {
        document.getElementById('recentBooks').innerHTML = '<p>No books available</p>';
      }
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}