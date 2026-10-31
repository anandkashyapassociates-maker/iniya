/**
 * Utility to compute time-sensitive greetings based on Indian Standard Time (IST / Asia/Kolkata).
 * 
 * Rules:
 * - Subha 12 PM se pehle: "Good Morning"
 * - 12 PM se 5 PM tak: "Good Afternoon"
 * - 5 PM (17:00) ke baad: "Good Evening"
 */
export function getIndianGreeting() {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    if (hour >= 4 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  } catch {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }
}

