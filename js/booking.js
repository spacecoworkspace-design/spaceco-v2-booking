// Shared booking logic used across select-room.html, select-time.html, booking-details.html,
// booking-confirmed.html, my-bookings.html. State between steps is carried in sessionStorage
// (not the URL) since it's a handful of fields and shouldn't survive past this one booking.

const ROOMS = [
  { label: "Room 4 Persons (1)", key: "room4-1" },
  { label: "Room 4 Persons (2)", key: "room4-2" },
  { label: "Room 6 Persons", key: "room6" },
  { label: "Room 8 Persons", key: "room8" },
  { label: "Class Room", key: "classroom" },
  { label: "Shared Space", key: "sharedspace" },
  { label: "Drawing Room", key: "drawingroom" },
];

const DRAFT_KEY = "spaceco_booking_draft";

function saveBookingDraft(draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function loadBookingDraft() {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearBookingDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

async function getBusyPeriods(supabase, roomKey, date) {
  const { data, error } = await supabase.rpc("get_room_busy_periods", { p_room_key: roomKey, p_date: date });
  if (error) return { error: error.message };
  return { periods: (data || []).map(p => ({ time_from: p.time_from.slice(0, 5), time_to: p.time_to.slice(0, 5) })) };
}

// Hourly start-time options, 08:00 through 22:00, each checked against busy periods for the
// chosen duration so the UI can mark which ones would collide.
function buildSlotOptions(busyPeriods, durationHours) {
  const slots = [];
  for (let startMin = 8 * 60; startMin <= 22 * 60; startMin += 60) {
    const startTime = minutesToTime(startMin);
    const endTime = minutesToTime(startMin + durationHours * 60);
    const blocked = busyPeriods.some(p => rangesOverlap(startTime, endTime, p.time_from, p.time_to));
    slots.push({ startTime, endTime, blocked });
  }
  return slots;
}

async function getSignedInClient(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("clients").select("id, name, phone, email").eq("auth_user_id", user.id).maybeSingle();
  return data || null;
}

async function submitBooking(supabase, { roomLabel, roomKey, date, timeIn, timeOut, client, guestName, guestPhone, guestEmail }) {
  const payload = {
    room: roomLabel,
    room_key: roomKey,
    reservation_date: date,
    time_in: timeIn,
    time_out: timeOut,
  };

  if (client) {
    payload.is_guest = false;
    payload.client_id = client.id;
  } else {
    payload.is_guest = true;
    payload.guest_name = guestName;
    payload.guest_phone = guestPhone;
    payload.guest_email = guestEmail || null;
  }

  // A guest has no RLS-visible way to read a reservation row back (by design -- guests can't
  // read arbitrary reservation data), so only ask for the row back when booking as a client.
  if (client) {
    const { data, error } = await supabase.from("reservations").insert(payload).select("id").single();
    if (error) return { error: error.message };
    return { reservationId: data.id };
  }

  const { error } = await supabase.from("reservations").insert(payload);
  if (error) return { error: error.message };
  return { reservationId: null };
}

async function fetchMyBookings(supabase) {
  const client = await getSignedInClient(supabase);
  if (!client) return { error: "not signed in" };

  const { data, error } = await supabase
    .from("reservations")
    .select("id, room, reservation_date, time_in, time_out, status")
    .eq("client_id", client.id)
    .order("reservation_date", { ascending: false });
  if (error) return { error: error.message };
  return { bookings: data || [] };
}

async function cancelBooking(supabase, reservationId) {
  const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservationId);
  return error ? { error: error.message } : { ok: true };
}
