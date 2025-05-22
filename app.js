// DOM Elements
const expenseForm = {
    title: document.getElementById('title'),
    amount: document.getElementById('amount'),
    category: document.getElementById('category'),
    date: document.getElementById('date'),
    addBtn: document.getElementById('add-btn'),
    updateBtn: document.getElementById('update-btn')
};

const summaryElements = {
    total: document.getElementById('total'),
    monthly: document.getElementById('monthly'),
    average: document.getElementById('average')
};

const incomeElements = {
    monthlyIncome: document.getElementById('monthly-income'),
    saveBtn: document.getElementById('save-income'),
    incomeDisplay: document.getElementById('income-display'),
    balanceDisplay: document.getElementById('balance-display')
};

const pendingElements = {
    personName: document.getElementById('person-name'),
    amount: document.getElementById('pending-amount'),
    type: document.getElementById('transaction-type'),
    addBtn: document.getElementById('add-pending'),
    list: document.getElementById('pending-transactions')
};

// State Management
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let monthlyIncome = parseFloat(localStorage.getItem('monthlyIncome')) || 0;
let pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions')) || [];
let editingExpenseId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    expenseForm.date.valueAsDate = new Date();
    updateSummary();
    renderExpenseList();
    renderCharts();
    updateIncomeDisplay();
    renderPendingTransactions();
});

// Event Listeners
expenseForm.addBtn.addEventListener('click', addExpense);
expenseForm.updateBtn.addEventListener('click', updateExpense);
incomeElements.saveBtn.addEventListener('click', saveIncome);
pendingElements.addBtn.addEventListener('click', addPendingTransaction);
document.getElementById('download-excel').addEventListener('click', downloadExcel);

// Expense Functions
function addExpense() {
    const expense = {
        id: Date.now(),
        title: expenseForm.title.value,
        amount: parseFloat(expenseForm.amount.value),
        category: expenseForm.category.value,
        date: expenseForm.date.value
    };

    if (!validateExpenseInput(expense)) return;

    expenses.push(expense);
    saveExpenses();
    resetForm();
    updateSummary();
    renderExpenseList();
    renderCharts();
}

function updateExpense() {
    if (!editingExpenseId) return;

    const index = expenses.findIndex(e => e.id === editingExpenseId);
    if (index === -1) return;

    expenses[index] = {
        ...expenses[index],
        title: expenseForm.title.value,
        amount: parseFloat(expenseForm.amount.value),
        category: expenseForm.category.value,
        date: expenseForm.date.value
    };

    saveExpenses();
    resetForm();
    updateSummary();
    renderExpenseList();
    renderCharts();
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    editingExpenseId = id;
    expenseForm.title.value = expense.title;
    expenseForm.amount.value = expense.amount;
    expenseForm.category.value = expense.category;
    expenseForm.date.value = expense.date;
    expenseForm.addBtn.style.display = 'none';
    expenseForm.updateBtn.style.display = 'block';
}

function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    expenses = expenses.filter(e => e.id !== id);
    saveExpenses();
    updateSummary();
    renderExpenseList();
    renderCharts();
}

// Income Management Functions
function saveIncome() {
    const income = parseFloat(incomeElements.monthlyIncome.value);
    if (isNaN(income) || income < 0) {
        alert('Please enter a valid income amount');
        return;
    }
    monthlyIncome = income;
    localStorage.setItem('monthlyIncome', income);
    updateIncomeDisplay();
}

function updateIncomeDisplay() {
    incomeElements.incomeDisplay.textContent = monthlyIncome.toFixed(2);
    const currentMonthExpenses = calculateMonthlyExpenses();
    const remainingBalance = monthlyIncome - currentMonthExpenses;
    incomeElements.balanceDisplay.textContent = remainingBalance.toFixed(2);
}

// Pending Transactions Functions
function addPendingTransaction() {
    const transaction = {
        id: Date.now(),
        person: pendingElements.personName.value,
        amount: parseFloat(pendingElements.amount.value),
        type: pendingElements.type.value,
        date: new Date().toISOString().split('T')[0]
    };

    if (!validatePendingTransaction(transaction)) return;

    pendingTransactions.push(transaction);
    savePendingTransactions();
    renderPendingTransactions();
    resetPendingForm();
}

function settlePendingTransaction(id) {
    pendingTransactions = pendingTransactions.filter(t => t.id !== id);
    savePendingTransactions();
    renderPendingTransactions();
}

// Utility Functions
function validateExpenseInput(expense) {
    if (!expense.title || !expense.amount || !expense.category || !expense.date) {
        alert('Please fill in all fields');
        return false;
    }
    if (isNaN(expense.amount) || expense.amount <= 0) {
        alert('Please enter a valid amount');
        return false;
    }
    return true;
}

function validatePendingTransaction(transaction) {
    if (!transaction.person || !transaction.amount) {
        alert('Please fill in all fields');
        return false;
    }
    if (isNaN(transaction.amount) || transaction.amount <= 0) {
        alert('Please enter a valid amount');
        return false;
    }
    return true;
}

function resetForm() {
    expenseForm.title.value = '';
    expenseForm.amount.value = '';
    expenseForm.category.value = '';
    expenseForm.date.valueAsDate = new Date();
    editingExpenseId = null;
    expenseForm.addBtn.style.display = 'block';
    expenseForm.updateBtn.style.display = 'none';
}

function resetPendingForm() {
    pendingElements.personName.value = '';
    pendingElements.amount.value = '';
    pendingElements.type.value = 'borrowed';
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function savePendingTransactions() {
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
}

function updateSummary() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthly = calculateMonthlyExpenses();
    const average = calculateDailyAverage();

    summaryElements.total.textContent = total.toFixed(2);
    summaryElements.monthly.textContent = monthly.toFixed(2);
    summaryElements.average.textContent = average.toFixed(2);
    updateIncomeDisplay();
}

function calculateMonthlyExpenses() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
}

function calculateDailyAverage() {
    if (expenses.length === 0) return 0;
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const dates = expenses.map(expense => new Date(expense.date));
    const daysDiff = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24) + 1;
    return total / daysDiff;
}

// Rendering Functions
function renderExpenseList() {
    const container = document.getElementById('expense-list');
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${expenses
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(expense => `
                        <tr>
                            <td>${new Date(expense.date).toLocaleDateString()}</td>
                            <td>${expense.title}</td>
                            <td>${expense.category}</td>
                            <td>₹${expense.amount.toFixed(2)}</td>
                            <td>
                                <button onclick="editExpense(${expense.id})" class="edit-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteExpense(${expense.id})" class="delete-btn">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
            </tbody>
        </table>
    `;
}

function renderPendingTransactions() {
    pendingElements.list.innerHTML = pendingTransactions
        .map(transaction => `
            <div class="pending-item ${transaction.type}">
                <span>${transaction.person}</span>
                <span>₹${transaction.amount.toFixed(2)}</span>
                <span>${transaction.type}</span>
                <button onclick="settlePendingTransaction(${transaction.id})">
                    <i class="fas fa-check"></i> Settle
                </button>
            </div>
        `).join('');
}

function renderCharts() {
    renderCategoryChart();
    renderTrendChart();
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryData = {};
    
    expenses.forEach(expense => {
        categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
    });

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#FF6384'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Expenses by Category'
                }
            }
        }
    });
}

function renderTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const monthlyData = {};

    expenses.forEach(expense => {
        const month = expense.date.substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthlyData),
            datasets: [{
                label: 'Monthly Expenses',
                data: Object.values(monthlyData),
                borderColor: '#36A2EB',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Expense Trend'
                }
            }
        }
    });
}

function downloadExcel() {
    const ws = XLSX.utils.json_to_sheet(expenses.map(e => ({
        Date: new Date(e.date).toLocaleDateString(),
        Title: e.title,
        Category: e.category,
        Amount: e.amount
    })));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
}
