-- keep information for config, candidates and timed_duel

update reg_key set used=0;

delete from votes;

delete from voters;

delete from timed_duel_result;

delete from single_vote;

delete from scores;
