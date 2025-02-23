const bountyBoardABI = [
    {
        "inputs": [{"internalType": "uint256","name": "taskId","type": "uint256"}],
        "name": "completeTask",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string","name": "description","type": "string"},
            {"internalType": "uint256","name": "reward","type": "uint256"}
        ],
        "name": "createTask",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false,"internalType": "uint256","name": "taskId","type": "uint256"},
            {"indexed": false,"internalType": "address","name": "completedBy","type": "address"}
        ],
        "name": "TaskCompleted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": false,"internalType": "uint256","name": "taskId","type": "uint256"},
            {"indexed": false,"internalType": "string","name": "description","type": "string"},
            {"indexed": false,"internalType": "uint256","name": "reward","type": "uint256"}
        ],
        "name": "TaskCreated",
        "type": "event"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    },
    {
        "inputs": [],
        "name": "taskCount",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "name": "tasks",
        "outputs": [
            {"internalType": "string","name": "description","type": "string"},
            {"internalType": "uint256","name": "reward","type": "uint256"},
            {"internalType": "bool","name": "completed","type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const contractAddress = "0x57C3f14b433f9E2AC7f49da8C4C8ecB6FBF2C680";

const connectWalletBtn = document.getElementById('connectWalletBtn');
const userAddress = document.getElementById('userAddress');
const createTaskForm = document.getElementById('createTaskForm');
const taskList = document.getElementById('taskList');

let provider, signer, contract;

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length === 0) throw new Error('No accounts found');

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, bountyBoardABI, signer);

        userAddress.textContent = `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
        connectWalletBtn.style.display = 'none';
        document.getElementById('createTaskSection').style.display = 'block';

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        getTasks();
    } catch (error) {
        console.error('Connection error:', error);
        alert(`Error: ${error.message}`);
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        userAddress.textContent = '';
        connectWalletBtn.style.display = 'block';
        document.getElementById('createTaskSection').style.display = 'none';
        taskList.innerHTML = '';
    } else {
        userAddress.textContent = `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
        getTasks();
    }
}

async function getTasks() {
    try {
        const taskCount = await contract.taskCount();
        taskList.innerHTML = '';

        for (let i = 0; i < taskCount; i++) {
            const task = await contract.tasks(i);
            const taskElement = document.createElement('div');
            taskElement.className = 'task-card';
            taskElement.innerHTML = `
                <h3>Task #${i + 1}</h3>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Reward:</strong> ${ethers.utils.formatEther(task.reward)} ETH</p>
                <button class="btn-primary complete-task" data-id="${i}" ${task.completed ? 'disabled' : ''}>
                    ${task.completed ? 'Completed' : 'Complete Task'}
                </button>
            `;
            taskList.appendChild(taskElement);
        }

        document.querySelectorAll('.complete-task').forEach(button => {
            button.addEventListener('click', completeTask);
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('taskDescription').value;
    const reward = ethers.utils.parseEther(document.getElementById('taskReward').value);

    try {
        const tx = await contract.createTask(description, reward);
        await tx.wait();
        alert('Task created successfully!');
        getTasks();
        createTaskForm.reset();
    } catch (error) {
        console.error('Error creating task:', error);
        alert(`Error: ${error.message}`);
    }
});

async function completeTask(e) {
    const taskId = e.target.dataset.id;
    try {
        const tx = await contract.completeTask(taskId);
        await tx.wait();
        alert('Task completed successfully!');
        getTasks();
    } catch (error) {
        console.error('Error completing task:', error);
        alert(`Error: ${error.message}`);
    }
}

connectWalletBtn.addEventListener('click', connectWallet);