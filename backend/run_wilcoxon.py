import csv
from scipy.stats import wilcoxon

ga = []
rnd = []

with open("wilcoxon_data.csv", "r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        ga.append(int(float(row["ga_total_conflicts"])))
        rnd.append(int(float(row["random_total_conflicts"])))

# We expect GA conflicts to be LOWER -> alternative="less"
stat, p = wilcoxon(ga, rnd, alternative="less")

print("GA total conflicts:", ga)
print("Random total conflicts:", rnd)
print("Wilcoxon statistic:", stat)
print("p-value (GA < Random):", p)
