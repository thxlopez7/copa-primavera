import { KnockoutStageService } from './lib/domain/KnockoutStageService.js';
import { GroupStageService } from './lib/domain/GroupStageService.js';

function runTests() {
  console.log("=== BRACKET TESTS ===");
  const testCases = [2, 3, 4, 5, 6, 7, 8, 16];
  
  testCases.forEach(n => {
    let pairs = Array.from({length: n}, (_, i) => `T${i+1}`);
    let matches = KnockoutStageService.generateBracket(pairs, "cat-1");
    
    let R1_matches = matches.filter(m => m.round_name.includes("match_") && (!m.next_match_id || matches.find(next => next.id === m.next_match_id).round_name.includes("match_") === false || m.metadata?.roundIndex === 0)); 
    // Actually, in the new code I can just check matches that have no source matches.
    // Let's just do standard checks.
    
    const bracketSize = KnockoutStageService.getNextPowerOf2(n);
    const byes = bracketSize - n;
    const expectedTotal = bracketSize - 1;
    
    let R1 = matches.filter(m => m._metadata?.roundIndex === 0);
    
    let nullVsNull = R1.filter(m => !m.team1_id && !m.team2_id).length;
    let selfMatch = R1.filter(m => m.team1_id && m.team2_id && m.team1_id === m.team2_id).length;
    let totalR1 = R1.length;
    
    let byeMatchesCount = R1.filter(m => m.status === 'completed' && m.result?.is_walkover).length;
    
    console.log(`[${n} teams] Total Matches: ${matches.length}/${expectedTotal} | R1 Matches: ${totalR1} | NULLvsNULL: ${nullVsNull} | BYEs Resolved: ${byeMatchesCount}/${byes}`);
    if (nullVsNull > 0 || matches.length !== expectedTotal || byeMatchesCount !== byes) {
      console.error(`FAILED for ${n} teams!`);
    }
  });
  
  console.log("\n=== ROUND ROBIN TESTS ===");
  const rrTestCases = [2, 3, 4, 5, 6];
  rrTestCases.forEach(n => {
    let pairs = Array.from({length: n}, (_, i) => `T${i+1}`);
    let matches = GroupStageService.generateRoundRobin(pairs, "cat-1", "A");
    let expected = (n * (n - 1)) / 2;
    console.log(`[${n} teams RR] Generated: ${matches.length} | Expected: ${expected}`);
  });
}

runTests();
