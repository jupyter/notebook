T_values = np.linspace(1, 2, 100)
C_values = [w * H - service_efficiency(I, T) for T in T_values]

plt.figure(figsize=(10, 6))
plt.plot(T_values, C_values, label='育児の機会費用')
plt.title('技術進歩と育児の機会費用の関係')
plt.xlabel('技術進歩係数 (T)')
plt.ylabel('育児の機会費用 (C)')
plt.legend()
plt.grid(True)
plt.show()
