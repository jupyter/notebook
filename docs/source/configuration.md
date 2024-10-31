import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing

# Step 1: Load and prepare data
data = {
    "Dates": [
        "10/31/20", "11/30/20", "12/31/20", "1/31/21", "2/28/21", "3/31/21",
        "4/30/21", "5/31/21", "6/30/21", "7/31/21", "8/31/21", "9/30/21",
        "10/31/21", "11/30/21", "12/31/21", "1/31/22", "2/28/22", "3/31/22",
        "4/30/22", "5/31/22", "6/30/22", "7/31/22", "8/31/22", "9/30/22",
        "10/31/22", "11/30/22", "12/31/22", "1/31/23", "2/28/23", "3/31/23",
        "4/30/23", "5/31/23", "6/30/23", "7/31/23", "8/31/23", "9/30/23",
        "10/31/23", "11/30/23", "12/31/23", "1/31/24", "2/29/24", "3/31/24",
        "4/30/24", "5/31/24", "6/30/24", "7/31/24", "8/31/24", "9/30/24"
    ],
    "Prices": [
        10.1, 10.3, 11.0, 10.9, 10.9, 10.9, 10.4, 9.84, 10.0, 10.1, 10.3, 10.2,
        10.1, 11.2, 11.4, 11.5, 11.8, 11.5, 10.7, 10.7, 10.4, 10.5, 10.4, 10.8,
        11.0, 11.6, 11.6, 12.1, 11.7, 12.0, 11.5, 11.2, 10.9, 11.4, 11.1, 11.5,
        11.8, 12.2, 12.8, 12.6, 12.4, 12.7, 12.1, 11.4, 11.5, 11.6, 11.5, 11.8
    ]
}

df = pd.DataFrame(data)
df['Dates'] = pd.to_datetime(df['Dates'])
df.set_index('Dates', inplace=True)

# Step 2: Time Series Analysis
model = ExponentialSmoothing(df['Prices'], seasonal='add', seasonal_periods=12).fit()

# Step 3: Estimation Function
def estimate_price(input_date):
    input_date = pd.to_datetime(input_date)
    # Predict future values
    future_dates = pd.date_range(start=df.index[-1] + timedelta(days=1), periods=12, freq='M')
    future_prices = model.forecast(steps=12)
    
    if input_date < df.index[0]:
        # Extrapolate backwards (not typically recommended)
        past_index = df.index[df.index <= input_date]
        return df['Prices'][past_index[-1]]  # last available price before input date
    elif input_date > df.index[-1]:
        # Extrapolate forward
        return future_prices.loc[input_date.strftime('%Y-%m-%d')]
    else:
        # If the date is in the existing range, return the actual price
        return df['Prices'].loc[input_date]

# Step 4: Visualization
plt.figure(figsize=(12, 6))
plt.plot(df.index, df['Prices'], label='Historical Prices', marker='o')
plt.plot(future_dates, future_prices, label='Forecasted Prices', marker='x', color='orange')
plt.xlabel('Date')
plt.ylabel('Price')
plt.title('Natural Gas Prices Over Time')
plt.legend()
plt.grid()
plt.show()

# Example Usage
input_date = '11/30/2024'
estimated_price = estimate_price(input_date)
print(f'Estimated price for {input_date}: {estimated_price:.2f}')
