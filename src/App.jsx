
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function calculateSchedule({ loanAmount, interestRate, offset, repayment, extraRepayment, extraFrequency, frequency, startDate, termYears }) {
  const results = [];
  const paymentsPerYear = { Weekly: 52, Fortnightly: 26, Monthly: 12 };
  const rate = interestRate / 100 / paymentsPerYear[frequency];
  const totalPeriods = termYears * paymentsPerYear[frequency];
  const deltaDays = frequency === "Weekly" ? 7 : frequency === "Fortnightly" ? 14 : 30;
  const extraEveryNPeriods = paymentsPerYear[frequency] / paymentsPerYear[extraFrequency];

  let balance = loanAmount;
  let date = new Date(startDate);
  let totalInterest = 0;
  let totalPaid = 0;

  for (let i = 0; i < totalPeriods && balance > 0; i++) {
    const interest = Math.max(0, (balance - offset) * rate);
    let principal = repayment - interest;
    const isExtraPeriod = i % Math.round(extraEveryNPeriods) === 0;

    if (isExtraPeriod) {
      principal += extraRepayment;
    }

    balance = Math.max(0, balance - principal);
    totalInterest += interest;
    totalPaid += repayment + (isExtraPeriod ? extraRepayment : 0);

    results.push({
      date: date.toISOString().slice(0, 10),
      balance: Math.round(balance),
      interest: Math.round(totalInterest),
      totalPaid: Math.round(totalPaid),
    });
    date.setDate(date.getDate() + deltaDays);
  }

  return results;
}

export default function HomeLoanCalculator() {
  const defaultLoan = {
    loanAmount: 600000,
    interestRate: 6.25,
    offset: 25000,
    repayment: 2000,
    extraRepayment: 0,
    extraFrequency: "Monthly",
    frequency: "Fortnightly",
    termYears: 30,
    startDate: new Date().toISOString().slice(0, 10),
  };

  const [loan1, setLoan1] = useState(defaultLoan);
  const [loan2, setLoan2] = useState(defaultLoan);
  const [schedule1, setSchedule1] = useState([]);
  const [schedule2, setSchedule2] = useState([]);
  const [mergedSchedule, setMergedSchedule] = useState([]);

  useEffect(() => {
    const s1 = calculateSchedule(loan1);
    const s2 = calculateSchedule(loan2);
    setSchedule1(s1);
    setSchedule2(s2);
    const maxLength = Math.max(s1.length, s2.length);
    const merged = Array.from({ length: maxLength }).map((_, i) => ({
      date: s1[i]?.date || s2[i]?.date || '',
      balance: s1[i]?.balance ?? null,
      interest: s1[i]?.interest ?? null,
      totalPaid: s1[i]?.totalPaid ?? null,
      balance2: s2[i]?.balance ?? null,
      interest2: s2[i]?.interest ?? null,
      totalPaid2: s2[i]?.totalPaid ?? null,
    }));
    setMergedSchedule(merged);
  }, [loan1, loan2]);

  const handleInput = (loanStateSetter, field) => (e) => {
    const value = field === "startDate" ? e.target.value : +e.target.value;
    loanStateSetter((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelect = (loanStateSetter, field) => (e) => {
    loanStateSetter((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {[loan1, loan2].map((loan, index) => (
          <Card key={index}>
            <CardContent className="grid grid-cols-2 gap-4 pt-4">
              <div className="col-span-2 font-bold">Loan {index + 1}</div>
              <div>
                <Label>Loan Amount ($)</Label>
                <Input type="number" value={loan.loanAmount} onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "loanAmount")} />
              </div>
              <div>
                <Label>Interest Rate (%)</Label>
                <Input type="number" value={loan.interestRate} step="0.01" onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "interestRate")} />
              </div>
              <div>
                <Label>Offset Amount ($)</Label>
                <Input type="number" value={loan.offset} onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "offset")} />
              </div>
              <div>
                <Label>Repayment Amount ($)</Label>
                <Input type="number" value={loan.repayment} onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "repayment")} />
              </div>
              <div>
                <Label>Repayment Frequency</Label>
                <select value={loan.frequency} onChange={handleSelect(index === 0 ? setLoan1 : setLoan2, "frequency")} className="border rounded px-2 py-1">
                  <option>Weekly</option>
                  <option>Fortnightly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div>
                <Label>Extra Repayment Amount ($)</Label>
                <Input type="number" value={loan.extraRepayment} onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "extraRepayment")} />
              </div>
              <div>
                <Label>Extra Repayment Frequency</Label>
                <select value={loan.extraFrequency} onChange={handleSelect(index === 0 ? setLoan1 : setLoan2, "extraFrequency")} className="border rounded px-2 py-1">
                  <option>Weekly</option>
                  <option>Fortnightly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div>
                <Label>Loan Term (Years)</Label>
                <Input type="number" value={loan.termYears} onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "termYears")} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={loan.startDate} onChange={handleInput(index === 0 ? setLoan1 : setLoan2, "startDate")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          <h2 className="text-lg font-bold mb-4">Loan Comparison Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mergedSchedule}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.ceil(mergedSchedule.length / 7)} minTickGap={80} />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Line type="monotone" dataKey="balance" stroke="#8884d8" dot={false} name="Loan 1 Balance" />
              <Line type="monotone" dataKey="balance2" stroke="#82ca9d" dot={false} name="Loan 2 Balance" />
              <Line type="monotone" dataKey="interest" stroke="#ff0000" dot={false} name="Loan 1 Interest" />
              <Line type="monotone" dataKey="interest2" stroke="#00b894" dot={false} name="Loan 2 Interest" />
              <Line type="monotone" dataKey="totalPaid" stroke="#ffa500" dot={false} name="Loan 1 Total Paid" />
              <Line type="monotone" dataKey="totalPaid2" stroke="#6c5ce7" dot={false} name="Loan 2 Total Paid" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
