(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-PROFILE-ALREADY-EXISTS u101)
(define-constant ERR-PROFILE-NOT-FOUND u102)
(define-constant ERR-INVALID-SCORE u103)
(define-constant ERR-INVALID-LOAN-COUNT u104)
(define-constant ERR-INVALID-REPAID_AMOUNT u105)
(define-constant ERR-INVALID_TIMESTAMP u106)
(define-constant ERR-INVALID_INCOME u107)
(define-constant ERR-INVALID_ASSET_VALUE u108)
(define-constant ERR-INVALID_HISTORY_ENTRY u109)
(define-constant ERR-MAX_HISTORY_EXCEEDED u110)
(define-constant ERR-INVALID_UPDATE_PARAM u111)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u112)
(define-constant ERR-INVALID_VERIFICATION_SOURCE u113)
(define-constant ERR-INVALID_CREDIT_FACTOR u114)
(define-constant ERR-INVALID_PENALTY_FACTOR u115)
(define-constant ERR-INVALID_MIN_SCORE u116)
(define-constant ERR-INVALID_MAX_SCORE u117)
(define-constant ERR-INVALID_ORACLE_PRINCIPAL u118)
(define-constant ERR-INVALID_DID u119)
(define-constant ERR-INVALID_STATUS u120)
(define-constant ERR-INVALID_CURRENCY u121)
(define-constant ERR-INVALID_LOCATION u122)
(define-constant ERR-INVALID_AGE u123)
(define-constant ERR-INVALID_EMPLOYMENT_STATUS u124)
(define-constant ERR-INVALID_EDUCATION_LEVEL u125)

(define-data-var profile-counter uint u0)
(define-data-var min-score uint u0)
(define-data-var max-score uint u1000)
(define-data-var credit-factor uint u10)
(define-data-var penalty-factor uint u20)
(define-data-var max-history-entries uint u50)
(define-data-var authority-contract (optional principal) none)
(define-data-var oracle-principal (optional principal) none)

(define-map CreditProfiles
  { user: principal }
  {
    did: (string-ascii 128),
    credit-score: uint,
    loan-count: uint,
    total-repaid: uint,
    total-borrowed: uint,
    last-updated: uint,
    income: uint,
    asset-value: uint,
    age: uint,
    employment-status: (string-ascii 50),
    education-level: (string-ascii 50),
    location: (string-utf8 100),
    currency: (string-ascii 20),
    status: bool
  }
)

(define-map ProfileHistory
  { user: principal, entry-id: uint }
  {
    timestamp: uint,
    score-change: int,
    reason: (string-ascii 256),
    verifier: principal
  }
)

(define-map HistoryCounters
  { user: principal }
  uint
)

(define-read-only (get-profile (user principal))
  (map-get? CreditProfiles { user: user })
)

(define-read-only (get-history-entry (user principal) (entry-id uint))
  (map-get? ProfileHistory { user: user, entry-id: entry-id })
)

(define-read-only (get-history-count (user principal))
  (default-to u0 (map-get? HistoryCounters { user: user }))
)

(define-read-only (get-min-score)
  (ok (var-get min-score))
)

(define-read-only (get-max-score)
  (ok (var-get max-score))
)

(define-private (validate-score (score uint))
  (if (and (>= score (var-get min-score)) (<= score (var-get max-score)))
      (ok true)
      (err ERR-INVALID_SCORE))
)

(define-private (validate-loan-count (count uint))
  (if (>= count u0)
      (ok true)
      (err ERR-INVALID_LOAN_COUNT))
)

(define-private (validate-repaid-amount (amount uint))
  (if (>= amount u0)
      (ok true)
      (err ERR-INVALID_REPAID_AMOUNT))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID_TIMESTAMP))
)

(define-private (validate-income (income uint))
  (if (>= income u0)
      (ok true)
      (err ERR-INVALID_INCOME))
)

(define-private (validate-asset-value (value uint))
  (if (>= value u0)
      (ok true)
      (err ERR-INVALID_ASSET_VALUE))
)

(define-private (validate-did (did (string-ascii 128)))
  (if (and (> (len did) u0) (<= (len did) u128))
      (ok true)
      (err ERR-INVALID_DID))
)

(define-private (validate-age (age uint))
  (if (and (>= age u18) (<= age u120))
      (ok true)
      (err ERR-INVALID_AGE))
)

(define-private (validate-employment-status (status (string-ascii 50)))
  (if (or (is-eq status "employed") (is-eq status "self-employed") (is-eq status "unemployed"))
      (ok true)
      (err ERR-INVALID_EMPLOYMENT_STATUS))
)

(define-private (validate-education-level (level (string-ascii 50)))
  (if (or (is-eq level "high-school") (is-eq level "bachelor") (is-eq level "master") (is-eq level "phd"))
      (ok true)
      (err ERR-INVALID_EDUCATION_LEVEL))
)

(define-private (validate-location (loc (string-utf8 100)))
  (if (and (> (len loc) u0) (<= (len loc) u100))
      (ok true)
      (err ERR-INVALID_LOCATION))
)

(define-private (validate-currency (cur (string-ascii 20)))
  (if (or (is-eq cur "STX") (is-eq cur "USD") (is-eq cur "BTC"))
      (ok true)
      (err ERR-INVALID_CURRENCY))
)

(define-private (validate-history-entry (reason (string-ascii 256)))
  (if (and (> (len reason) u0) (<= (len reason) u256))
      (ok true)
      (err ERR-INVALID_HISTORY_ENTRY))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-oracle-principal (oracle principal))
  (begin
    (try! (validate-principal oracle))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
    (var-set oracle-principal (some oracle))
    (ok true)
  )
)

(define-public (set-min-score (new-min uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
    (asserts! (<= new-min (var-get max-score)) (err ERR-INVALID_MIN_SCORE))
    (var-set min-score new-min)
    (ok true)
  )
)

(define-public (set-max-score (new-max uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
    (asserts! (>= new-max (var-get min-score)) (err ERR-INVALID_MAX_SCORE))
    (var-set max-score new-max)
    (ok true)
  )
)

(define-public (set-credit-factor (factor uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
    (asserts! (> factor u0) (err ERR-INVALID_CREDIT_FACTOR))
    (var-set credit-factor factor)
    (ok true)
  )
)

(define-public (set-penalty-factor (factor uint))
  (begin
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (asserts! (is-eq tx-sender (unwrap! (var-get authority-contract) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
    (asserts! (> factor u0) (err ERR-INVALID_PENALTY_FACTOR))
    (var-set penalty-factor factor)
    (ok true)
  )
)

(define-public (create-credit-profile
  (did (string-ascii 128))
  (initial-score uint)
  (income uint)
  (asset-value uint)
  (age uint)
  (employment-status (string-ascii 50))
  (education-level (string-ascii 50))
  (location (string-utf8 100))
  (currency (string-ascii 20))
)
  (let
    (
      (user tx-sender)
      (profile-id (var-get profile-counter))
    )
    (try! (validate-did did))
    (try! (validate-score initial-score))
    (try! (validate-income income))
    (try! (validate-asset-value asset-value))
    (try! (validate-age age))
    (try! (validate-employment-status employment-status))
    (try! (validate-education-level education-level))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (asserts! (is-none (map-get? CreditProfiles { user: user })) (err ERR-PROFILE-ALREADY-EXISTS))
    (map-set CreditProfiles
      { user: user }
      {
        did: did,
        credit-score: initial-score,
        loan-count: u0,
        total-repaid: u0,
        total-borrowed: u0,
        last-updated: block-height,
        income: income,
        asset-value: asset-value,
        age: age,
        employment-status: employment-status,
        education-level: education-level,
        location: location,
        currency: currency,
        status: true
      }
    )
    (map-set HistoryCounters { user: user } u0)
    (var-set profile-counter (+ profile-id u1))
    (print { event: "profile-created", user: user, id: profile-id })
    (ok profile-id)
  )
)

(define-public (update-credit-score
  (user principal)
  (borrowed-amount uint)
  (repayment-amount uint)
  (successful bool)
  (reason (string-ascii 256))
)
  (let
    (
      (profile (unwrap! (map-get? CreditProfiles { user: user }) (err ERR-PROFILE-NOT-FOUND)))
      (current-score (get credit-score profile))
      (score-change
        (if successful
          (to-int (var-get credit-factor))
          (* (to-int (var-get penalty-factor)) -1)
        )
      )
      (new-score (+ current-score (to-uint score-change)))
      (history-count (default-to u0 (map-get? HistoryCounters { user: user })))
      (new-history-id history-count)
    )
    (asserts! (or (is-eq tx-sender user) (is-eq tx-sender (unwrap! (var-get oracle-principal) (err ERR-AUTHORITY-NOT-VERIFIED)))) (err ERR-NOT-AUTHORIZED))
    (try! (validate-repaid-amount repayment-amount))
    (try! (validate-history-entry reason))
    (asserts! (< history-count (var-get max-history-entries)) (err ERR-MAX_HISTORY_EXCEEDED))
    (map-set CreditProfiles
      { user: user }
      {
        did: (get did profile),
        credit-score: (if (> new-score (var-get max-score)) (var-get max-score) (if (< new-score (var-get min-score)) (var-get min-score) new-score)),
        loan-count: (+ (get loan-count profile) u1),
        total-repaid: (if successful (+ (get total-repaid profile) repayment-amount) (get total-repaid profile)),
        total-borrowed: (+ (get total-borrowed profile) borrowed-amount),
        last-updated: block-height,
        income: (get income profile),
        asset-value: (get asset-value profile),
        age: (get age profile),
        employment-status: (get employment-status profile),
        education-level: (get education-level profile),
        location: (get location profile),
        currency: (get currency profile),
        status: (get status profile)
      }
    )
    (map-set ProfileHistory
      { user: user, entry-id: new-history-id }
      {
        timestamp: block-height,
        score-change: score-change,
        reason: reason,
        verifier: tx-sender
      }
    )
    (map-set HistoryCounters { user: user } (+ history-count u1))
    (print { event: "score-updated", user: user, new-score: new-score })
    (ok true)
  )
)

(define-public (add-verified-data
  (user principal)
  (income uint)
  (asset-value uint)
  (source (string-ascii 128))
)
  (let
    (
      (profile (unwrap! (map-get? CreditProfiles { user: user }) (err ERR-PROFILE-NOT-FOUND)))
    )
    (asserts! (is-eq tx-sender (unwrap! (var-get oracle-principal) (err ERR-AUTHORITY-NOT-VERIFIED))) (err ERR-NOT-AUTHORIZED))
    (try! (validate-income income))
    (try! (validate-asset-value asset-value))
    (asserts! (and (> (len source) u0) (<= (len source) u128)) (err ERR-INVALID_VERIFICATION_SOURCE))
    (map-set CreditProfiles
      { user: user }
      {
        did: (get did profile),
        credit-score: (get credit-score profile),
        loan-count: (get loan-count profile),
        total-repaid: (get total-repaid profile),
        total-borrowed: (get total-borrowed profile),
        last-updated: block-height,
        income: income,
        asset-value: asset-value,
        age: (get age profile),
        employment-status: (get employment-status profile),
        education-level: (get education-level profile),
        location: (get location profile),
        currency: (get currency profile),
        status: (get status profile)
      }
    )
    (print { event: "data-verified", user: user, source: source })
    (ok true)
  )
)

(define-public (update-personal-info
  (age uint)
  (employment-status (string-ascii 50))
  (education-level (string-ascii 50))
  (location (string-utf8 100))
  (currency (string-ascii 20))
)
  (let
    (
      (user tx-sender)
      (profile (unwrap! (map-get? CreditProfiles { user: user }) (err ERR-PROFILE-NOT-FOUND)))
    )
    (try! (validate-age age))
    (try! (validate-employment-status employment-status))
    (try! (validate-education-level education-level))
    (try! (validate-location location))
    (try! (validate-currency currency))
    (map-set CreditProfiles
      { user: user }
      {
        did: (get did profile),
        credit-score: (get credit-score profile),
        loan-count: (get loan-count profile),
        total-repaid: (get total-repaid profile),
        total-borrowed: (get total-borrowed profile),
        last-updated: block-height,
        income: (get income profile),
        asset-value: (get asset-value profile),
        age: age,
        employment-status: employment-status,
        education-level: education-level,
        location: location,
        currency: currency,
        status: (get status profile)
      }
    )
    (print { event: "personal-info-updated", user: user })
    (ok true)
  )
)

(define-public (deactivate-profile)
  (let
    (
      (user tx-sender)
      (profile (unwrap! (map-get? CreditProfiles { user: user }) (err ERR-PROFILE-NOT-FOUND)))
    )
    (map-set CreditProfiles
      { user: user }
      {
        did: (get did profile),
        credit-score: (get credit-score profile),
        loan-count: (get loan-count profile),
        total-repaid: (get total-repaid profile),
        total-borrowed: (get total-borrowed profile),
        last-updated: block-height,
        income: (get income profile),
        asset-value: (get asset-value profile),
        age: (get age profile),
        employment-status: (get employment-status profile),
        education-level: (get education-level profile),
        location: (get location profile),
        currency: (get currency profile),
        status: false
      }
    )
    (print { event: "profile-deactivated", user: user })
    (ok true)
  )
)

(define-public (reactivate-profile)
  (let
    (
      (user tx-sender)
      (profile (unwrap! (map-get? CreditProfiles { user: user }) (err ERR-PROFILE-NOT-FOUND)))
    )
    (asserts! (not (get status profile)) (err ERR-INVALID_STATUS))
    (map-set CreditProfiles
      { user: user }
      {
        did: (get did profile),
        credit-score: (get credit-score profile),
        loan-count: (get loan-count profile),
        total-repaid: (get total-repaid profile),
        total-borrowed: (get total-borrowed profile),
        last-updated: block-height,
        income: (get income profile),
        asset-value: (get asset-value profile),
        age: (get age profile),
        employment-status: (get employment-status profile),
        education-level: (get education-level profile),
        location: (get location profile),
        currency: (get currency profile),
        status: true
      }
    )
    (print { event: "profile-reactivated", user: user })
    (ok true)
  )
)