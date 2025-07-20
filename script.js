(function() {
    const form = document.getElementById('record-form');
    const tableBody = document.querySelector('#records-table tbody');
    const tooltip = document.getElementById('tooltip');

    const fields = ['date','exercise','weight','reps','sets','comment','tags'];

    function loadRecords() {
        const records = JSON.parse(localStorage.getItem('records') || '[]');
        tableBody.innerHTML = '';
        records.forEach((record, index) => {
            const tr = document.createElement('tr');
            fields.forEach(f => {
                const td = document.createElement('td');
                td.textContent = record[f] || '';
                tr.appendChild(td);
            });
            const actionsTd = document.createElement('td');
            actionsTd.className = 'actions';
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => editRecord(index));
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', () => deleteRecord(index));
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(delBtn);
            tr.appendChild(actionsTd);
            tableBody.appendChild(tr);
        });
    }

    function saveRecord(e) {
        e.preventDefault();
        const record = {};
        fields.forEach(f => {
            record[f] = document.getElementById(f).value;
        });
        const records = JSON.parse(localStorage.getItem('records') || '[]');
        if(form.dataset.editIndex) {
            records[form.dataset.editIndex] = record;
            delete form.dataset.editIndex;
        } else {
            records.push(record);
        }
        localStorage.setItem('records', JSON.stringify(records));
        form.reset();
        loadRecords();
    }

    function editRecord(index) {
        const records = JSON.parse(localStorage.getItem('records') || '[]');
        const record = records[index];
        fields.forEach(f => {
            document.getElementById(f).value = record[f];
        });
        form.dataset.editIndex = index;
    }

    function deleteRecord(index) {
        const records = JSON.parse(localStorage.getItem('records') || '[]');
        records.splice(index, 1);
        localStorage.setItem('records', JSON.stringify(records));
        loadRecords();
    }

    function handleTooltip(e) {
        const target = e.target;
        if(target.classList.contains('help')) {
            tooltip.textContent = target.dataset.help;
            tooltip.style.display = 'block';
            const rect = target.getBoundingClientRect();
            tooltip.style.top = rect.bottom + 'px';
            tooltip.style.left = rect.left + 'px';
        } else {
            tooltip.style.display = 'none';
        }
    }

    form.addEventListener('submit', saveRecord);
    document.addEventListener('mouseover', handleTooltip);
    document.addEventListener('mouseout', handleTooltip);

    loadRecords();
})();
