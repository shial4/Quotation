document.addEventListener('DOMContentLoaded', function () {
    loadCachedData();
  });
  
  function cacheData(key, value) {
    console.info('caching ', key, ' with value: ', value);
    try {
      if (key === 'logo' && value instanceof File) {
        // Special case for file input
        const file = value;
        const reader = new FileReader();
        reader.onload = function (event) {
          const dataURI = event.target.result;
          console.info('caching logo url:', dataURI);
          saveToLocalStorage(key, dataURI);
        };
        reader.readAsDataURL(file);
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
          // Special case for 'logo' key
          const logoFile = cachedData[key];
          cacheData(key, logoFile);
  
          // Call the function to refresh the logo display
          refreshLogoDisplay(logoFile);
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
          // Special case for date input
          element.valueAsDate = new Date(cachedData[key]);
        } else {
          // General case for other input types
          element.value = cachedData[key];
        }
      }
    });
  
    // Recalculate on page load
    recalculate();
  }
  
  function refreshLogoDisplay(logoBlob) {
    const logoDisplay = document.getElementById('logoDisplay');
    if (logoDisplay && logoBlob instanceof Blob) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const dataURI = event.target.result;
        logoDisplay.src = dataURI;
      };
      reader.readAsDataURL(logoBlob);
    }
  }     
  
  function dataURItoBlob(dataURI) {
    try {
      if (!dataURI || typeof dataURI !== 'string') {
        throw new Error('Invalid dataURI');
      }
  
      const byteString = atob(dataURI.split(',')[1]);
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (error) {
      console.error('Error converting dataURI to blob:', error, 'DataURI:', dataURI);
      return null;
    }
  }      
  
  function updateRelatedFields(key, value) {
    // Add logic to update related fields
    if (key === 'companyName') {
      // If Company Name is updated, update the 'from' field
      const fromField = document.getElementById('from');
      if (fromField) {
        fromField.innerText = value;
      }
    } else if (key === 'from') {
      // If 'FROM' field is updated, update the 'companyName' field
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
  
  function exportToPDF(jsPDFInstance) {
    // Create a new jsPDF instance if not provided
    const pdf = jsPDFInstance || new jsPDF();
  
    // Add company details to PDF
    doc.text('Company Name: ' + (getCachedData('companyName') || ''), 20, 20);
    doc.text('Address: ' + (getCachedData('companyAddress') || ''), 20, 30);
    doc.text('Mobile: ' + (getCachedData('companyMobile') || ''), 20, 40);
    doc.text('Fax: ' + (getCachedData('companyFax') || ''), 20, 50);
  
    // Add quotation details to PDF
    doc.text('Date: ' + (getCachedData('date') || ''), 20, 70);
    doc.text('FROM: ' + (getCachedData('companyName') || ''), 20, 80);
    doc.text('TO: ' + (getCachedData('to') || ''), 20, 90);
    doc.text('RE: ' + (getCachedData('re') || ''), 20, 100);
    doc.text('ATTN: ' + (getCachedData('attn') || ''), 20, 110);
  
    // Add quotation positions to PDF
    const positions = deserializePositions(getCachedData('positions')) || [];
    let positionY = 130;
  
    positions.forEach(position => {
      doc.text('Description: ' + position.description, 20, positionY);
      doc.text('Cost: $' + position.cost, 120, positionY);
      positionY += 20;
    });
  
    // Add summary to PDF
    const totalCost = parseFloat(document.getElementById('totalCost').innerText) || 0;
    const gst = parseFloat(document.getElementById('gst').innerText) || 0;
    const grandTotal = parseFloat(document.getElementById('grandTotal').innerText) || 0;
  
    doc.text('Total Cost: $' + totalCost.toFixed(2), 20, positionY + 20);
    doc.text('GST (10%): $' + gst.toFixed(2), 20, positionY + 30);
    doc.text('Grand Total: $' + grandTotal.toFixed(2), 20, positionY + 40);
  
    // Save PDF
    const pdfData = doc.output('blob');
  
    // Create a data URL for the PDF blob
    const pdfUrl = URL.createObjectURL(pdfData);
  
    // Open user's email client with attachment
    window.location.href = `mailto:?subject=Quotation%20PDF&body=Please%20find%20attached%20the%20quotation%20PDF.&attachment=${pdfUrl}`;
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
  