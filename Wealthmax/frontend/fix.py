with open("src/pages/FinancialDashboard.tsx", "r") as f:
    content = f.read()
content = content.replace("\\'", "'")
with open("src/pages/FinancialDashboard.tsx", "w") as f:
    f.write(content)
