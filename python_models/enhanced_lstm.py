
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
import json
import sys
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import sqlite3
import os

class EarthquakeLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=128, num_layers=2, num_classes=5, dropout=0.2):
        super(EarthquakeLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=dropout)
        self.fc1 = nn.Linear(hidden_size, 64)
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, num_classes)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc1(out[:, -1, :])
        out = self.relu(out)
        out = self.dropout(out)
        out = self.fc2(out)
        out = self.relu(out)
        out = self.fc3(out)
        return out

class QuakeDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.long)
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

def load_earthquake_data():
    """Load earthquake data from the database"""
    try:
        # Connect to the database (adjust path as needed)
        conn = sqlite3.connect(':memory:')  # Use in-memory for now
        
        # Mock data for demonstration - in real implementation, connect to PostgreSQL
        mock_data = {
            'magnitude': np.random.normal(5.0, 1.5, 10000),
            'time': pd.date_range('2020-01-01', periods=10000, freq='H'),
            'lat': np.random.uniform(-90, 90, 10000),
            'lon': np.random.uniform(-180, 180, 10000)
        }
        
        df = pd.DataFrame(mock_data)
        df = df[df['magnitude'] > 0]  # Remove negative magnitudes
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def prepare_sequences(df, seq_length=10):
    """Prepare sequences for LSTM training"""
    scaler = MinMaxScaler()
    df_sorted = df.sort_values('time')
    
    # Scale magnitude data
    mag_scaled = scaler.fit_transform(df_sorted['magnitude'].values.reshape(-1, 1))
    
    # Create magnitude bins
    bins = [0, 4, 5, 6, 7, np.inf]
    labels = [0, 1, 2, 3, 4]  # minor, light, moderate, strong, major
    df_sorted['mag_bin'] = pd.cut(df_sorted['magnitude'], bins=bins, labels=labels, include_lowest=True).cat.codes
    
    X, y = [], []
    for i in range(len(mag_scaled) - seq_length):
        X.append(mag_scaled[i:i+seq_length].flatten())
        y.append(df_sorted['mag_bin'].iloc[i+seq_length])
    
    return np.array(X).reshape(-1, seq_length, 1), np.array(y), scaler

def train_model():
    """Enhanced training function based on the provided script"""
    print("Loading earthquake data...")
    df = load_earthquake_data()
    if df is None:
        return {"error": "Failed to load data"}
    
    # Prepare sequences
    X, y, scaler = prepare_sequences(df)
    
    # Split data - emphasize post-2020 for validation
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    # Create datasets
    train_dataset = QuakeDataset(X_train, y_train)
    val_dataset = QuakeDataset(X_val, y_val)
    
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=64)
    
    # Initialize model
    model = EarthquakeLSTM()
    
    # Dynamic class weights (heavy FN penalty for major quakes)
    class_counts = np.bincount(y_train)
    class_weights = 1.0 / (class_counts + 1e-6)
    # Amplify weights for major earthquakes (bins 3 and 4)
    class_weights = class_weights * np.array([1.0, 1.2, 1.5, 2.0, 3.0])
    class_weights = torch.tensor(class_weights / class_weights.sum(), dtype=torch.float32)
    
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    
    # Training loop with recall target
    model.train()
    recall = 0.0
    epoch = 0
    best_recall = 0.0
    
    while recall < 0.95 and epoch < 100:  # Prevent infinite loop
        epoch_loss = 0
        for batch_idx, (data, target) in enumerate(train_loader):
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()
        
        # Validation
        model.eval()
        val_preds, val_actuals = [], []
        with torch.no_grad():
            for data, target in val_loader:
                output = model(data)
                pred = output.argmax(dim=1)
                val_preds.extend(pred.cpu().numpy())
                val_actuals.extend(target.cpu().numpy())
        
        # Calculate metrics
        accuracy = accuracy_score(val_actuals, val_preds)
        precision = precision_score(val_actuals, val_preds, average='weighted', zero_division=0)
        recall = recall_score(val_actuals, val_preds, average='weighted', zero_division=0)
        f1 = f1_score(val_actuals, val_preds, average='weighted', zero_division=0)
        
        scheduler.step(epoch_loss)
        
        if recall > best_recall:
            best_recall = recall
            # Save best model
            torch.save(model.state_dict(), 'best_earthquake_model.pth')
        
        model.train()
        epoch += 1
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch}: Loss: {epoch_loss:.4f}, Acc: {accuracy:.3f}, Precision: {precision:.3f}, Recall: {recall:.3f}, F1: {f1:.3f}")
    
    return {
        "training_completed": True,
        "final_epoch": epoch,
        "final_metrics": {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1)
        }
    }

def predict_magnitude(sequence_data):
    """Make magnitude predictions using the trained model"""
    try:
        model = EarthquakeLSTM()
        model.load_state_dict(torch.load('best_earthquake_model.pth'))
        model.eval()
        
        # Convert input to tensor
        input_tensor = torch.tensor(sequence_data, dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
            predicted_bin = output.argmax(dim=1).item()
            confidence = probabilities.max().item()
        
        # Map bin to magnitude range
        magnitude_ranges = {
            0: (0, 4),    # minor
            1: (4, 5),    # light
            2: (5, 6),    # moderate
            3: (6, 7),    # strong
            4: (7, 10)    # major
        }
        
        mag_range = magnitude_ranges[predicted_bin]
        expected_magnitude = (mag_range[0] + mag_range[1]) / 2
        
        # Determine risk level
        risk_levels = ['low', 'low', 'medium', 'high', 'extreme']
        risk_level = risk_levels[predicted_bin]
        
        return {
            "magnitudeBin": predicted_bin,
            "confidence": float(confidence),
            "probabilityDistribution": probabilities[0].tolist(),
            "expectedMagnitude": float(expected_magnitude),
            "riskLevel": risk_level,
            "magnitudeRange": mag_range
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "train":
            result = train_model()
            print(json.dumps(result))
            
        elif command == "predict":
            # Expect sequence data as JSON string
            try:
                sequence_data = json.loads(sys.argv[2])
                result = predict_magnitude(sequence_data)
                print(json.dumps(result))
            except Exception as e:
                print(json.dumps({"error": str(e)}))
                
        else:
            print(json.dumps({"error": "Unknown command"}))
    else:
        print(json.dumps({"error": "No command provided"}))
