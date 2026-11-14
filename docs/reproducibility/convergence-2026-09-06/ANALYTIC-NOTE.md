# Coherent-minority rejection: bounded derivation

Assistant-produced analysis after the initial E1 sweep; not preregistered theory, a peer-reviewed theorem, or evidence of the applicant's independent mastery.

At source revision `323c12f6c17753b0b408a3f0e34265939395d864`, consider exactly the E1 fixtures: N=100 distinct inputs, m in [1,50] with value 1, the rest value 0, identical evaluation timestamps and stage locations. Spatial plus temporal weight contributes 0.8. Values are separated by more than the clustering threshold. Agreement coefficient is gamma in {0,0.2}, without coefficient renormalization. The implemented weight clamp is inactive here.

The two per-input weights are

`w1 = 0.8 + gamma*(m-1)/99`

`w0 = 0.8 + gamma*(99-m)/99`.

Let `q = m*w1 / (m*w1 + (100-m)*w0)` be the minority's fraction of total weight. The weighted mean is q. Weighted population variance is `q*(1-q)`, so the minority z-score is `sqrt((1-q)/q)`. In exact arithmetic the minority survives the implemented z <= tau comparison iff `q >= 1/(1+tau*tau)`, provided the minimum-count and near-zero-variance bypasses are inactive. These bypasses are inactive for these fixtures. The majority z-score is `sqrt(q/(1-q))`.

At tau=2.5 the minority survival boundary is `4/29`, approximately 0.137931. With gamma=0.2, m=15 has q=41/313, approximately 0.130990; m=16 has q=548/3901, approximately 0.140477. Thus the source's rejection of all 15 minority inputs and retention of all 16 is explained by the declared formula, not by a transport artifact.

With gamma=0, equal weights yield q=m/100: m=13 is rejected, m=14 retained. Agreement weighting therefore changes the integer transition from 14 to 16 for this particular cohort. This does not establish a desirable or undesirable universal social policy.

`results/analytic-crosscheck.json` compares the algebraic weighted mean with all 500 observed rows (tolerance 1e-12), checks all non-boundary minority classifications, and preserves equality-boundary rows separately. Floating-point equality at tau=1, m=50 is not silently treated as exact arithmetic. Confidence is computed *after* filtering: m=15 yields value=0, confidence=1 and participationRate=0.85. Confidence=1 here does not imply unanimous original input, calibrated probability, democratic legitimacy, or empirical user agreement.

This derivation covers two exact coherent groups at fixed geometry/time, no smoothing, and the inspected implementation. It does not cover distributions with noise, duplicate IDs, network validation, changing audiences, adversaries, or psychological outcomes.
