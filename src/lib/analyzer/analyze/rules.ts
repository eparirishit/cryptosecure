import { Severity } from "@/types/analysis";

export interface SecurityRule {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  scenario: string;
  suggestion: string;
  pattern: RegExp; // The regex to match against NORMALIZED code
  invert?: boolean; // If true, the rule fails if the pattern is NOT found
}

export const RULES: SecurityRule[] = [
  {
    id: "FUNC_BOUNCED_CHECK",
    title: "Missing Bounced Message Check",
    severity: "MEDIUM",
    description: "Smart contracts should handle or ignore bounced messages to avoid processing them as normal transactions.",
    scenario: "An attacker triggers a bounce (e.g., insufficient gas or error in a called contract). If unhandled, your contract might re-process this as a new deposit or command, potentially corrupting state or double-spending.",
    suggestion: "Add `if (flags & 1) { return (); }` at the start of recv_internal.",
    // Look for "flags & 1" check
    pattern: /flags\s*&\s*1/,
    invert: true // Fail if we DO NOT see this pattern
  },
  {
    id: "FUNC_OWNER_CHECK",
    title: "Missing Owner Access Control",
    severity: "CRITICAL",
    description: "Critical functions (like withdrawals) appear to be missing access controls.",
    scenario: "An attacker calls a privileged function (e.g., change_owner, withdraw). Without an `equal_slices(sender, owner)` check, the contract executes the command, allowing full takeover or fund drainage.",
    suggestion: "Ensure you check `equal_slices(sender_address, owner_address)` before processing privileged operations.",
    pattern: /equal_slices/i,
    invert: true
  },
  {
    id: "FUNC_SEND_RAW_MSG",
    title: "Unchecked Message Sending",
    severity: "HIGH",
    description: "The contract sends raw messages. Ensure the mode (e.g., 128, 64) is correct to avoid draining the balance.",
    scenario: "A contract sends funds using a mode like 128 (carry all balance) based on user input. An attacker exploits this to drain the entire contract balance in a single transaction.",
    suggestion: "Verify the second argument of `send_raw_message`. Use mode 64 for returning change, or explicit amounts.",
    pattern: /send_raw_message\s*\(\s*[^,]+,\s*(0|1|2)\s*\)/, // Warn if mode is low/dangerous without careful checks
  },
  {
    id: "TIPJAR_VULNERABILITY",
    title: "Potential Unprotected Withdrawal",
    severity: "CRITICAL",
    description: "Detected a pattern resembling the 'TipJar' bug: balance subtraction without obvious authority checks.",
    scenario: "The contract subtracts from `total_balance` based on a user request (op=2). However, no `throw_unless` checks the sender's identity. Any user can simply request a withdrawal and drain the pot.",
    suggestion: "Add `throw_unless(401, equal_slices(sender_address, owner_address));` before modifying the balance.",
    // Look for subtraction of balance AND send_raw_message
    pattern: /total_balance\s*-=|send_raw_message/
  }
];
