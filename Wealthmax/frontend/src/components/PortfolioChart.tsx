import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Equity", value: 58, color: "hsl(211, 100%, 27%)" },
  { name: "Debt", value: 25, color: "hsl(27, 90%, 54%)" },
  { name: "Gold", value: 12, color: "hsl(45, 80%, 55%)" },
  { name: "Cash", value: 5, color: "hsl(var(--muted-foreground))" },
];

const PortfolioChart = () => {
  return (
    <div className="bg-card rounded border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">Portfolio Overview</h3>
        <span className="text-sm font-semibold text-foreground">₹24,85,320</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 grid gap-2.5">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
