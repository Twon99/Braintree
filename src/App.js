import React, { useState, useEffect, useRef } from 'react';
import dropin from 'braintree-web-drop-in';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    financialProviderName: '',
    nameOnCard: '',
    compensationCode: '',
    financialProviderCode: '',
    amount: '',
  });
  const [btInstance, setBtInstance] = useState(null);
  const dropinContainer = useRef(null);

  useEffect(() => {
    console.log('Fetching client token...');
    fetch('http://localhost:3001/client_token')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.text();
      })
      .then(clientToken => {
        console.log('Client token:', clientToken);
        dropin.create({
          authorization: clientToken,
          container: dropinContainer.current,
        }, (error, instance) => {
          if (error) {
            console.error('Drop-in UI Error:', error);
          } else {
            console.log('Drop-in UI Initialized');
            setBtInstance(instance);
          }
        });
      })
      .catch(error => console.error('Failed to fetch client token:', error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCopyName = () => {
    setFormData({
      ...formData,
      nameOnCard: formData.financialProviderName,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (btInstance) {
      btInstance.requestPaymentMethod((error, payload) => {
        if (error) {
          console.error('Payment Method Request Error:', error);
        } else {
          fetch('http://localhost:3001/checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              paymentMethodNonce: payload.nonce,
              amount: formData.amount,
              financialProviderName: formData.financialProviderName,
              nameOnCard: formData.nameOnCard,
              compensationCode: formData.compensationCode,
              financialProviderCode: formData.financialProviderCode,
            })
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              alert('Payment successful! Transaction ID: ' + data.transactionId);
            } else {
              alert('Payment failed: ' + data.error);
            }
          });
        }
      });
    }
  };

  return (
    <div className="App">
      <h1>Payment Form</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Financial Provider Name:
            <input type="text" name="financialProviderName" value={formData.financialProviderName} onChange={handleChange} required />
          </label>
          <button type="button" onClick={handleCopyName} className="copy-button">Copy to Name on Card</button>
        </div>
        <div className="form-group">
          <label>
            Name on Card:
            <input type="text" name="nameOnCard" value={formData.nameOnCard} onChange={handleChange} required />
          </label>
        </div>
        <div className="form-group">
          <label>
            Compensation Code:
            <input type="text" name="compensationCode" value={formData.compensationCode} onChange={handleChange} required />
          </label>
        </div>
        <div className="form-group">
          <label>
            Financial Provider Code:
            <input type="text" name="financialProviderCode" value={formData.financialProviderCode} onChange={handleChange} required />
          </label>
        </div>
        <div className="form-group">
          <label>
            Amount:
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required />
          </label>
        </div>
        <div ref={dropinContainer} className="dropin-container"></div>
        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
}

export default App;
