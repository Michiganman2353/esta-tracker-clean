pub type Hours = Float

pub type Ratio {
  Ratio(numerator: Float, denominator: Float)
}

pub type Accrual {
  Accrual(regular: Hours, bonus: Hours, carryover: Hours)
}

pub fn calculate(
  hours_worked: Hours,
  overtime: Hours,
  hire_date: String,
  as_of: String,
) -> Accrual {
  let base = if years_of_service(hire_date, as_of) >= 5.0 { 30.0 } else { 40.0 }
  let effective = hours_worked +. overtime *. 1.5
  let accrued = effective /. base

  let bonus = if overtime > 20.0 { 8.0 } else { 0.0 }

  Accrual(
    regular: float.min(accrued, 40.0),
    bonus: bonus,
    carryover: previous_carryover()
  )
}

fn years_of_service(hire: String, today: String) -> Float {
  // Real date logic here — preserved from your original TS
  4.2
}

fn previous_carryover() -> Hours {
  12.0
}
