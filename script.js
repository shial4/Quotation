document.addEventListener('DOMContentLoaded', function () {
    loadCachedData();
    setCurrentDate();
  });
  
  function setCurrentDate() {
    const currentDate = new Date();
    const dateInput = document.getElementById('date');
    
    // Format the date as YYYY-MM-DD for input value
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    dateInput.value = formattedDate;
}

  function cacheData(key, value) {
    try {
      if (key === 'logo' && value instanceof File) {
        return;
    } else if (key === 'fromCompany') {
        saveToLocalStorage('companyName', value);
    } else {
        saveToLocalStorage(key, value);
    }
  
      // Update related fields if needed
      updateRelatedFields(key, value);
  
      // Recalculate when any data changes
      recalculate();
    } catch (error) {
      console.error('Error caching data:', error);
    }
  } 
  
  function saveToLocalStorage(key, value) {
    const cachedData = JSON.parse(localStorage.getItem('quotationData')) || {};
    cachedData[key] = value;
    localStorage.setItem('quotationData', JSON.stringify(cachedData));
  }
  
  function loadCachedData() {
    const cachedData = JSON.parse(localStorage.getItem('quotationData')) || {};
  
    // Load all cached fields
    Object.keys(cachedData).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (key === 'logo') {
            return;
        } else if (element.type === 'file') {
          // Other file inputs
          if (cachedData[key]) {
            const file = dataURItoBlob(cachedData[key]);
            if (file) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(new File([file], key));
  
              Object.defineProperty(element, 'files', {
                value: dataTransfer.files,
                writable: true,
                configurable: true,
              });
            }
          }
        } else if (element.type === 'date') {
            element.valueAsDate = new Date(cachedData[key]);
        } else if (key === 'companyName') {
            // Special case for date input
            element.value = cachedData[key];
            updateRelatedFields(key, element.value);
          } else {
          // General case for other input types
          element.value = cachedData[key];
        }
      }
    });
  
    // Recalculate on page load
    recalculate();
  }
  
  function chooseLogo() {
    const input = document.getElementById('logo');
    input.click(); 
  }          
  
  function updateRelatedFields(key, value) {
    if (key === 'companyName') {
        const companyNameField = document.getElementById('fromCompany');
        if (companyNameField) {
          companyNameField.value = value;
        }
    } else if (key === 'fromCompany') {
      const companyNameField = document.getElementById('companyName');
      if (companyNameField) {
        companyNameField.value = value;
      }
    }
  }   
  
  function addQuotationPosition() {
    const positionsContainer = document.getElementById('positions');
  
    // Create new position element
    const newPosition = document.createElement('div');
    newPosition.innerHTML = `
      <label>Description:</label>
      <input type="text" class="description" oninput="cacheData('positions', serializePositions())">
      <label>Cost:</label>
      <input type="number" class="cost" oninput="cacheData('positions', serializePositions())">
      <button onclick="removeQuotationPosition(this)">Remove</button>
    `;
  
    positionsContainer.appendChild(newPosition);
  
    // Recalculate when a position is added
    recalculate();
  }
  
  function removeQuotationPosition(button) {
    const positionElement = button.parentNode;
    positionElement.parentNode.removeChild(positionElement);
  
    // Recalculate when a position is removed
    recalculate();
  }
  
  function recalculate() {
    calculateTotalCost();
    // Other recalculation logic if needed
  }
  
  function calculateTotalCost() {
    const positions = document.querySelectorAll('#positions > div');
    let totalCost = 0;
  
    positions.forEach(position => {
      const costInput = position.querySelector('.cost');
      totalCost += parseFloat(costInput.value) || 0;
    });
  
    const gst = totalCost * 0.1;
    const grandTotal = totalCost + gst;
  
    document.getElementById('totalCost').innerText = totalCost.toFixed(2);
    document.getElementById('gst').innerText = gst.toFixed(2);
    document.getElementById('grandTotal').innerText = grandTotal.toFixed(2);
  }
  
  function printQuotation() {
    // Apply print styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = 'styles.css'; // Replace with the path to your CSS file
    document.head.appendChild(link);
  
    // Print the quotation
    window.print();
  
    // Remove the added stylesheet after printing
    document.head.removeChild(link);
  }  

  function serializePositions() {
    const positions = [];
    const positionElements = document.querySelectorAll('#positions > div');
  
    positionElements.forEach(positionElement => {
      const description = positionElement.querySelector('.description').value || '';
      const cost = positionElement.querySelector('.cost').value || 0;
  
      positions.push({ description, cost });
    });
  
    return JSON.stringify(positions);
  }
  
  function deserializePositions(serializedPositions) {
    try {
      return JSON.parse(serializedPositions);
    } catch (error) {
      console.error('Error deserializing positions:', error);
      return null;
    }
  }
  
  function getCachedData(key) {
    return JSON.parse(localStorage.getItem('quotationData'))?.[key] || '';
  }
  