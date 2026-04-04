import csv
from scipy.stats import friedmanchisquare

FILE = "friedman_soft.csv"   # CSV adı

ga, manual, rnd = [], [], []

with open(FILE, "r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        ga.append(float(row["ga_soft"]))
        manual.append(float(row["manual_soft"]))
        rnd.append(float(row["random_soft"]))

stat, p = friedmanchisquare(ga, manual, rnd)

print("GA:", ga)
print("MANUAL:", manual)
print("RANDOM:", rnd)
print("Friedman chi-square:", stat)
print("p-value:", p)

# Basit özet: ortalamalar
print("\nMeans:")
print("GA mean:", sum(ga)/len(ga))
print("Manual mean:", sum(manual)/len(manual))
print("Random mean:", sum(rnd)/len(rnd))
