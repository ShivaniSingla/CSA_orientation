import type { Challenge } from '../types';

export const challenges: Challenge[] = [
  // ══════════════════════════════════════════════════════════
  // PLAYER 1 — Initial Access & Suspicious Situations
  // ══════════════════════════════════════════════════════════

  {
    id: 'p1-c0',
    playerNumber: 1,
    challengeIndex: 0,
    type: 'decision',
    title: 'THE "OBVIOUS" PHISHING LINK',
    question: 'Scenario: You receive an email at your company address: "Your password expires in 1 hour. Click this link to keep your current password: http://secure-bank.com/reset." You immediately think it is phishing. However, your IT manager says you are wrong.\n\nQuestion: What is the most patient and logically correct NEXT step to prove whether this is real or fake?',
    options: [
      "Forward the email to your personal Gmail account and open the link on your phone.",
      "Block the sender's email address immediately and alert the whole company.",
      "Do not click anything. Check the full email headers and independently contact the IT manager through a trusted channel to confirm whether they sent it.",
      "Click the link to see where it goes. If it asks for your password, you know it's fake."
    ],
    answer: "Do not click anything. Check the full email headers and independently contact the IT manager through a trusted channel to confirm whether they sent it.",
    timeLimit: 40
  },
  {
    id: 'p1-c1',
    playerNumber: 1,
    challengeIndex: 1,
    type: 'logic',
    title: 'THE "IMPOSSIBLE" PASSWORD',
    question: 'Scenario: A system requires an 8-character password with upper/lowercase letters, numbers, and symbols. You try P@ssw0rd, but the system rejects it. You try variations like P@ssw0rd! and P@ssw0r, but those are rejected too.\n\nQuestion: What is the most logical reason the system is rejecting your password?',
    options: [
      "The system may have a blacklist of common or compromised passwords. P@ssw0rd is extremely common, so choose a genuinely unique password.",
      "The system requires exactly 8 characters, so you only need another 8-character word.",
      "The system is clearly glitched. Restart your computer.",
      "The system doesn't like symbols, so remove the @."
    ],
    answer: "The system may have a blacklist of common or compromised passwords. P@ssw0rd is extremely common, so choose a genuinely unique password.",
    timeLimit: 35
  },
  {
    id: 'p1-c2',
    playerNumber: 1,
    challengeIndex: 2,
    type: 'decision',
    title: 'THE "BURIED" NEEDLE',
    question: 'Scenario: You are given a massive text file containing 500 lines of server logs. You are asked to find every occurrence of the word ERROR. After 10 minutes of reading line-by-line, you\'ve covered only 50 lines.\n\nQuestion: What is the most intelligent way to handle this task?',
    options: [
      "Delete all lines that don't contain ERROR.",
      "Read faster and skim only for capital letters.",
      "Stop reading manually and use the Find feature (Ctrl+F) or a simple grep command to locate every occurrence of ERROR.",
      "Ask your manager for a two-hour extension."
    ],
    answer: "Stop reading manually and use the Find feature (Ctrl+F) or a simple grep command to locate every occurrence of ERROR.",
    timeLimit: 35
  },
  {
    id: 'p1-c3',
    playerNumber: 1,
    challengeIndex: 3,
    type: 'decision',
    title: 'THE "STOLEN" COOKIE',
    question: 'Scenario: While working, you find a suspicious file named passwords.txt on your desktop. You don\'t remember creating it. You panic, delete it, and run an antivirus scan.\n\nQuestion: Why was deleting the file the WRONG first move?',
    options: [
      "You should have moved it to the Recycle Bin because the Recycle Bin is encrypted.",
      "Deleting files uses system resources.",
      "The file might be a decoy.",
      "Deleting it can destroy valuable digital evidence. You should preserve the file, record relevant details such as its location and timestamp, and report it to IT/security for investigation."
    ],
    answer: "Deleting it can destroy valuable digital evidence. You should preserve the file, record relevant details such as its location and timestamp, and report it to IT/security for investigation.",
    timeLimit: 40
  },

  // ══════════════════════════════════════════════════════════
  // PLAYER 2 — Social Engineering & Human Behavior
  // ══════════════════════════════════════════════════════════

  {
    id: 'p2-c0',
    playerNumber: 2,
    challengeIndex: 0,
    type: 'decision',
    title: 'THE "TWO-FACTOR" TRAP',
    question: 'Scenario: You receive an unexpected 6-digit 2FA code. Two seconds later, someone calls from a number that appears to be your bank\'s official hotline.\n\nThey say:\n"We detected fraud. Please read us the code we just sent so we can cancel the transaction."\n\nQuestion: What is the critical flaw in their request?',
    options: [
      "The bank already knows the code it generated. Asking you to read it aloud could allow the caller to use that code to authenticate as you.",
      "Read the code but intentionally change one number to test them.",
      "The caller ID looks real, but hackers can copy phone numbers.",
      "The code has six digits instead of four."
    ],
    answer: "The bank already knows the code it generated. Asking you to read it aloud could allow the caller to use that code to authenticate as you.",
    timeLimit: 40
  },
  {
    id: 'p2-c1',
    playerNumber: 2,
    challengeIndex: 1,
    type: 'decision',
    title: 'THE "HELPFUL" USB',
    question: 'Scenario: You find a USB drive in your college computer lab labeled:\n\n"IMPORTANT — EXAM RESULTS"\n\nYou are curious because your class\'s results haven\'t been announced yet.\n\nQuestion: What is the safest and most logical action?',
    options: [
      "Plug it into a lab computer because lab computers have antivirus software.",
      "Plug it into your phone because phones cannot get infected from USB drives.",
      "Do not plug it in. Hand it to the lab administrator or appropriate IT/security staff.",
      "Plug it into your laptop to see who it belongs to."
    ],
    answer: "Do not plug it in. Hand it to the lab administrator or appropriate IT/security staff.",
    timeLimit: 35
  },
  {
    id: 'p2-c2',
    playerNumber: 2,
    challengeIndex: 2,
    type: 'decision',
    title: 'THE "URGENT" IT CALL',
    question: 'Scenario: Someone calls you claiming to be from your college IT department.\n\nThey say:\n"Your account has been compromised. I need your login password immediately to secure it. This is urgent."\n\nThe caller knows your name and department.\n\nQuestion: What should make you suspicious?',
    options: [
      "They are asking for your password. You should independently contact the IT department through an official channel instead of trusting the incoming call.",
      "You should give them the password and change it afterward.",
      "They know your name.",
      "They sound professional and confident."
    ],
    answer: "They are asking for your password. You should independently contact the IT department through an official channel instead of trusting the incoming call.",
    timeLimit: 40
  },
  {
    id: 'p2-c3',
    playerNumber: 2,
    challengeIndex: 3,
    type: 'observation',
    title: 'THE "FREE WI-FI" TRAP',
    question: 'At an event, you see two Wi-Fi networks:\n\nEVENT_FREE_WIFI\nEVENT_FREE_WIFI_5G\n\nNeither network has a password. One has a very strong signal.\n\nQuestion: What is the most logical next step before connecting?',
    options: [
      "Choose the network with the strongest signal.",
      "Choose the network with 5G because it must be the official one.",
      "Verify the official network name with the event organizers before connecting.",
      "Connect to both and see which one works better."
    ],
    answer: "Verify the official network name with the event organizers before connecting.",
    timeLimit: 35
  },

  // ══════════════════════════════════════════════════════════
  // PLAYER 3 — Investigation & Decision Making
  // ══════════════════════════════════════════════════════════

  {
    id: 'p3-c0',
    playerNumber: 3,
    challengeIndex: 0,
    type: 'decision',
    title: 'THE "STRANGE LOGIN"',
    question: 'Scenario: You receive a security notification saying your account was logged into at 3:12 AM from a location you\'ve never visited. You are currently asleep at that time.\n\nQuestion: What should you do FIRST?',
    options: [
      "Ignore it because security alerts can sometimes be wrong.",
      "Immediately post about the attack on social media.",
      "Reply directly to the security-alert email asking whether it was real.",
      "Verify the alert through the official account/security portal, secure the account using trusted methods, and report the suspicious login if confirmed."
    ],
    answer: "Verify the alert through the official account/security portal, secure the account using trusted methods, and report the suspicious login if confirmed.",
    timeLimit: 40
  },
  {
    id: 'p3-c1',
    playerNumber: 3,
    challengeIndex: 1,
    type: 'decision',
    title: 'THE "TOO GOOD" DOWNLOAD',
    question: 'Scenario: You search online for a paid software tool. The first result says:\n\n"FREE FULL VERSION — NO INSTALLATION REQUIRED — DOWNLOAD NOW!"\n\nThe website has dozens of flashing advertisements and asks you to disable your antivirus before downloading.\n\nQuestion: What is the most logical conclusion?',
    options: [
      "Disable antivirus temporarily because the software might trigger a false positive.",
      "It's probably safe because it appears first in the search results.",
      "The request to disable security protections is a major warning sign. You should obtain the software from its official or trusted source instead.",
      "Download it first and scan it afterward."
    ],
    answer: "The request to disable security protections is a major warning sign. You should obtain the software from its official or trusted source instead.",
    timeLimit: 35
  },
  {
    id: 'p3-c2',
    playerNumber: 3,
    challengeIndex: 2,
    type: 'decision',
    title: 'THE "ACCIDENTAL" ACCESS',
    question: 'Scenario: While browsing a shared college drive, you accidentally discover a folder containing private student documents that you are not supposed to access.\n\nYou can open the files.\n\nQuestion: What is the most responsible action?',
    options: [
      "Delete the folder so nobody else can access it.",
      "Stop accessing the folder and report the incorrect permissions to the responsible administrator/security team.",
      "Download the interesting files before reporting the problem.",
      "Look through the files because you already have access."
    ],
    answer: "Stop accessing the folder and report the incorrect permissions to the responsible administrator/security team.",
    timeLimit: 40
  },
  {
    id: 'p3-c3',
    playerNumber: 3,
    challengeIndex: 3,
    type: 'decision',
    title: 'THE "SCREENSHOT" MYSTERY',
    question: 'Scenario: A friend sends you a screenshot showing a message supposedly from your college director saying:\n\n"Classes are cancelled tomorrow. Forward this to everyone immediately."\n\nThe screenshot looks completely genuine.\n\nQuestion: What should you do before forwarding it?',
    options: [
      "Edit the screenshot to add \"UNCONFIRMED\" and then forward it.",
      "Forward it because the screenshot looks authentic.",
      "Verify the announcement through an official college communication channel before sharing it.",
      "Ask your friend whether they think it is real."
    ],
    answer: "Verify the announcement through an official college communication channel before sharing it.",
    timeLimit: 35
  },

  // ══════════════════════════════════════════════════════════
  // PLAYER 4 — Final Decision Challenges
  // ══════════════════════════════════════════════════════════

  {
    id: 'p4-c0',
    playerNumber: 4,
    challengeIndex: 0,
    type: 'decision',
    title: 'THE "PASSWORD RESET" TRAP',
    question: 'Scenario: You receive a password-reset email for an account you didn\'t request. The email contains a button saying:\n\n"Cancel Password Reset"\n\nYou are worried someone is trying to access your account.\n\nQuestion: What is the safest response?',
    options: [
      "Click Cancel Password Reset immediately.",
      "Forward the email to your friends to ask if they received it too.",
      "Reply to the email asking who requested the reset.",
      "Do not use the email link. Open the service's official website/app independently and check the account security settings and recent activity.",
    ],
    answer: "Do not use the email link. Open the service's official website/app independently and check the account security settings and recent activity.",
    timeLimit: 40
  },
  {
    id: 'p4-c1',
    playerNumber: 4,
    challengeIndex: 1,
    type: 'decision',
    title: 'THE "SCREEN LOCK" PROBLEM',
    question: 'Scenario: You are working in a college lab. You need to leave your computer for only two minutes to ask your professor a question.\n\nYour friend is sitting nearby.\n\nQuestion: What is the safest action?',
    options: [
      "Lock the computer before leaving, even if you expect to be away for only a short time.",
      "Close the browser but leave the computer unlocked.",
      "Shut down the computer every time you leave.",
      "Leave the computer unlocked because your friend is trustworthy."
    ],
    answer: "Lock the computer before leaving, even if you expect to be away for only a short time.",
    timeLimit: 30
  },
  {
    id: 'p4-c2',
    playerNumber: 4,
    challengeIndex: 2,
    type: 'decision',
    title: 'THE "FAKE UPDATE"',
    question: 'Scenario: While browsing a website, a large popup suddenly appears:\n\n"URGENT! Your Chrome browser is infected. Download this security update immediately!"\n\nThere is a big DOWNLOAD UPDATE button.\n\nQuestion: What should you do?',
    options: [
      "Close the popup and ignore all future browser updates.",
      "Download the file and scan it with antivirus afterward.",
      "Do not click the popup. Close the page and check for updates through the browser's official settings or trusted update mechanism.",
      "Download it immediately because browser security is important."
    ],
    answer: "Do not click the popup. Close the page and check for updates through the browser's official settings or trusted update mechanism.",
    timeLimit: 35
  },
  {
    id: 'p4-c3',
    playerNumber: 4,
    challengeIndex: 3,
    type: 'decision',
    title: 'FINAL BREACH: THE "SMALL CLUES"',
    question: 'Scenario: You are investigating a suspicious login. You discover three things:\n\nThe login happened at 3:00 AM.\nThe IP address is from another country.\nThe account was accessed immediately after a password-reset request.\n\nYour teammate says:\n"None of these proves the account was hacked. Let\'s ignore it until we have absolute proof."\n\nQuestion: What is the best response?',
    options: [
      "Ignore the event because there isn't enough evidence.",
      "Treat the combination of clues as suspicious, preserve the relevant evidence, and investigate further before making a final conclusion.",
      "Delete the account immediately to prevent further damage.",
      "Immediately accuse the user of being hacked."
    ],
    answer: "Treat the combination of clues as suspicious, preserve the relevant evidence, and investigate further before making a final conclusion.",
    timeLimit: 45
  }
];

export function getChallengesForPlayer(playerNumber: number): Challenge[] {
  return challenges.filter(c => c.playerNumber === playerNumber);
}

export function getChallengeByIndex(playerNumber: number, challengeIndex: number): Challenge | undefined {
  return challenges.find(c => c.playerNumber === playerNumber && c.challengeIndex === challengeIndex);
}
