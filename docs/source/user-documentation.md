import matplotlib.pyplot as plt
from ipywidgets import interact, FloatSlider, IntSlider

# -----------------------------
# Emission Factors (kg CO2 per unit)
# -----------------------------
EMISSION_FACTORS = {
    "car_km": 0.12,      # per km
    "bus_km": 0.05,
    "train_km": 0.04,
    "flight_km": 0.25,
    "electricity_kwh": 0.82,  # India avg
    "lpg_kg": 2.9,
    "meat_meal": 5.0,
    "veg_meal": 2.0,
    "vegan_meal": 1.5
}

# -----------------------------
# Carbon Footprint Calculator
# -----------------------------
def carbon_footprint(car_km, bus_km, train_km, flight_km, electricity, lpg, meat, veg, vegan):
    # Travel
    travel_cf = (car_km * EMISSION_FACTORS["car_km"] +
                 bus_km * EMISSION_FACTORS["bus_km"] +
                 train_km * EMISSION_FACTORS["train_km"] +
                 flight_km * EMISSION_FACTORS["flight_km"])

    # Energy
    energy_cf = (electricity * EMISSION_FACTORS["electricity_kwh"] +
                 lpg * EMISSION_FACTORS["lpg_kg"])

    # Food
    food_cf = (meat * EMISSION_FACTORS["meat_meal"] +
               veg * EMISSION_FACTORS["veg_meal"] +
               vegan * EMISSION_FACTORS["vegan_meal"])

    total_cf = travel_cf + energy_cf + food_cf

    # Results
    print(f"🌱 Your Daily Carbon Footprint: {total_cf:.2f} kg CO₂")
    print(f"- Travel: {travel_cf:.2f} kg")
    print(f"- Energy: {energy_cf:.2f} kg")
    print(f"- Food: {food_cf:.2f} kg")
    print("\n💡 Suggestions:")

    if car_km > 0:
        print("🚍 Use public transport or carpool instead of driving alone.")
    if meat > 0:
        print("🥦 Try reducing meat meals, include more vegetarian/vegan options.")
    if electricity > 5:
        print("🔌 Save energy: switch to LED bulbs, turn off unused devices.")

    # Chart
    labels = ["Travel", "Energy", "Food"]
    values = [travel_cf, energy_cf, food_cf]

    fig, ax = plt.subplots()
    ax.pie(values, labels=labels, autopct="%1.1f%%", startangle=90)
    plt.show()

# -----------------------------
# Interactive Sliders (Jupyter)
# -----------------------------
interact(
    carbon_footprint,
    car_km=FloatSlider(min=0, max=100, step=1, value=0, description="Car (km)"),
    bus_km=FloatSlider(min=0, max=100, step=1, value=0, description="Bus (km)"),
    train_km=FloatSlider(min=0, max=100, step=1, value=0, description="Train (km)"),
    flight_km=FloatSlider(min=0, max=5000, step=50, value=0, description="Flight (km)"),
    electricity=FloatSlider(min=0, max=50, step=1, value=0, description="Electricity (kWh)"),
    lpg=FloatSlider(min=0, max=20, step=1, value=0, description="LPG (kg)"),
    meat=IntSlider(min=0, max=10, step=1, value=0, description="Meat meals"),
    veg=IntSlider(min=0, max=10, step=1, value=0, description="Veg meals"),
    vegan=IntSlider(min=0, max=10, step=1, value=0, description="Vegan
:maxdepth: 2

notebook
ui_components
notebook_7_features
examples/Notebook/examples_index.rst
custom_css
configuring/plugins
configuring/interface_customization
troubleshooting
changelog
```
