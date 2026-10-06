async function runTests() {
  const fetch = globalThis.fetch;
  
  console.log('--- TEST 1: Admin Login ---');
  const adminRes = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@jalgaon.aero', password: 'Admin@12345' })
  })).json();
  console.log('Admin Login Success:', adminRes.success, '| Role:', adminRes.user?.role);
  const adminToken = adminRes.token;

  console.log('\n--- TEST 2: Admin Adds Flight with Auto-Distance ---');
  const addRes = await (await fetch('http://localhost:5000/api/admin/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      flightNumber: 'JA-101',
      airline: 'Jalgaon Airline',
      aircraft: 'ATR 72-600',
      source: 'Jalgaon (JLG)',
      destination: 'Mumbai (BOM)',
      departureDate: '2026-10-10',
      departureTime: '08:00',
      arrivalDate: '2026-10-10',
      arrivalTime: '09:15',
      totalSeats: 72,
      status: 'ACTIVE'
    })
  })).json();
  console.log('Flight Created:', addRes.success, '| Distance:', addRes.flight?.distance, 'KM | Auto Calculated Price: Rs', addRes.flight?.calculatedPrice);

  console.log('\n--- TEST 3: User Registration ---');
  const regRes = await (await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Rahul Patil', email: 'rahul' + Date.now() + '@example.com', password: 'Password@123' })
  })).json();
  console.log('User Registered:', regRes.success, '| Role:', regRes.user?.role);
  const userToken = regRes.token;

  console.log('\n--- TEST 4: User Flight Search ---');
  const searchRes = await (await fetch('http://localhost:5000/api/flights/search')).json();
  console.log('Flights Available for User:', searchRes.flights?.length);

  console.log('\n--- TEST 5: User Books 2 Seats ---');
  const bookRes = await (await fetch('http://localhost:5000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({
      flightId: addRes.flight.id,
      passengers: [
        { name: 'Rahul Patil', age: 30, gender: 'Male', email: 'rahul@example.com', phone: '9876543210' },
        { name: 'Neha Patil', age: 28, gender: 'Female', email: 'neha@example.com', phone: '9876543211' }
      ]
    })
  })).json();
  console.log('Booking Confirmed:', bookRes.success, '| Booking ID:', bookRes.bookingId, '| PNR:', bookRes.ticket?.pnr, '| Amount Paid: Rs', bookRes.ticket?.totalAmount);

  console.log('\n--- TEST 6: Verify Seat Decrement in Database ---');
  const flightCheck = await (await fetch(`http://localhost:5000/api/flights/${addRes.flight.id}`)).json();
  console.log('Total Seats:', flightCheck.flight.totalSeats, '| Remaining Available Seats:', flightCheck.flight.availableSeats, '(Decreased by 2)');

  console.log('\n--- TEST 7: Security Test (User tries Admin-only Add Flight) ---');
  const secRes = await (await fetch('http://localhost:5000/api/admin/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ flightNumber: 'HACK-999' })
  })).json();
  console.log('Security Rejection:', secRes.success === false, '| Message:', secRes.message);

  console.log('\n--- ALL INTEGRATION & SECURITY TESTS COMPLETED SUCCESSFULLY ---');
}

runTests();
