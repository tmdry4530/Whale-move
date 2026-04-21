# EVENTS — When Whales Move

> 분석에 오버레이할 21개 이벤트 카탈로그.
> 이 파일은 파이프라인이 직접 파싱하여 `events` 테이블에 적재한다.
> **수정 시 반드시 사용자 컨펌**을 받는다 (분석의 기준선이라 영향이 큼).

---

## 카테고리 정의

| 카테고리 | 의미 | 예 |
|---|---|---|
| `crash` | 급격한 가격 하락 / 공포 | 코로나 블랙 서스데이, LUNA 붕괴 |
| `rally` | 강한 상승 모멘텀 | BTC/ETH ETF 승인 |
| `crisis` | 시장 신뢰/시스템 위기 | FTX 파산, 거래소 해킹 |
| `mania` | 과열 / 투기 광풍 | DeFi Summer, 김치프리미엄 |
| `regulation` | 규제 / 정책 변화 | 트럼프 관세, 특금법 시행 |

---

## 글로벌 이벤트 (15개)

```yaml
- id: covid_black_thursday
  name_ko: 코로나 블랙 서스데이
  name_en: COVID Black Thursday
  event_date: 2020-03-12
  category: crash
  region: global
  description: 코로나19 팬데믹 공포로 BTC가 하루 만에 약 50% 폭락. 전 세계 자산이 동반 급락.
  source_url: https://en.wikipedia.org/wiki/2020_stock_market_crash

- id: defi_summer
  name_ko: DeFi 서머
  name_en: DeFi Summer
  event_date: 2020-06-15
  category: mania
  region: global
  description: Compound의 거버넌스 토큰 분배를 시작으로 DeFi 프로토콜 TVL이 폭증한 시기.
  source_url: https://en.wikipedia.org/wiki/Decentralized_finance

- id: btc_ath_2021
  name_ko: BTC 첫 6만달러 돌파
  name_en: BTC All-Time High 2021
  event_date: 2021-04-14
  category: rally
  region: global
  description: BTC가 사상 첫 $64,000을 돌파한 강세장 정점. 코인베이스 상장과 맞물림.
  source_url: https://www.cnbc.com/2021/04/14/bitcoin-btc-and-ether-eth-prices-rally-ahead-of-coinbase-listing.html

- id: china_mining_ban
  name_ko: 중국 채굴 금지
  name_en: China Mining Ban
  event_date: 2021-05-21
  category: regulation
  region: global
  description: 중국 정부가 BTC 채굴 전면 금지. 글로벌 해시레이트 절반 가까이 급락.
  source_url: https://en.wikipedia.org/wiki/Cryptocurrency_in_China

- id: btc_ath_2021_nov
  name_ko: BTC 사상 최고가
  name_en: BTC ATH November 2021
  event_date: 2021-11-10
  category: rally
  region: global
  description: BTC가 약 $69,000으로 사상 최고가 기록. 강세장의 정점.
  source_url: https://www.forbes.com/sites/cbovaird/2021/11/10/bitcoin-hits-latest-all-time-high-close-to-69000-as-multiple-factors-drive-gains/

- id: luna_collapse
  name_ko: 테라/루나 붕괴
  name_en: Terra/LUNA Collapse
  event_date: 2022-05-09
  category: crash
  region: global
  description: 알고리즘 스테이블코인 UST의 디페깅과 LUNA 토큰의 99%+ 폭락. 약 $400억 시가총액 증발.
  source_url: https://en.wikipedia.org/wiki/Terra_(blockchain)

- id: ethereum_merge
  name_ko: 이더리움 머지
  name_en: Ethereum Merge
  event_date: 2022-09-15
  category: rally
  region: global
  description: 이더리움이 PoW에서 PoS로 전환. 에너지 소비 99.95% 감소.
  source_url: https://ethereum.org/en/upgrades/merge/

- id: ftx_collapse
  name_ko: FTX 파산
  name_en: FTX Collapse
  event_date: 2022-11-11
  category: crisis
  region: global
  description: 세계 2위 거래소 FTX가 유동성 위기로 파산 신청. 암호화폐 시장 신뢰도에 큰 충격.
  source_url: https://en.wikipedia.org/wiki/Bankruptcy_of_FTX

- id: silicon_valley_bank
  name_ko: 실리콘밸리뱅크 파산
  name_en: Silicon Valley Bank Failure
  event_date: 2023-03-10
  category: crisis
  region: global
  description: SVB 파산으로 USDC 발행사 Circle의 예치금 일부가 묶임. USDC 일시 디페깅.
  source_url: https://en.wikipedia.org/wiki/Collapse_of_Silicon_Valley_Bank

- id: btc_etf_approval
  name_ko: 미국 BTC 현물 ETF 승인
  name_en: US Bitcoin Spot ETF Approval
  event_date: 2024-01-10
  category: rally
  region: global
  description: SEC가 11개 BTC 현물 ETF를 동시 승인. 제도권 자금 유입의 신호탄.
  source_url: https://www.sec.gov/news/statement/gensler-statement-spot-bitcoin-011023

- id: btc_halving_2024
  name_ko: BTC 4차 반감기
  name_en: BTC Halving 2024
  event_date: 2024-04-19
  category: rally
  region: global
  description: BTC 블록 보상이 6.25 → 3.125 BTC로 반감. 4년 주기의 공급 충격 이벤트.
  source_url: https://en.wikipedia.org/wiki/Bitcoin

- id: eth_etf_approval
  name_ko: 미국 ETH 현물 ETF 승인
  name_en: US Ethereum Spot ETF Approval
  event_date: 2024-05-23
  category: rally
  region: global
  description: SEC가 ETH 현물 ETF를 승인. ETH의 제도권 진입 가속.
  source_url: https://www.sec.gov/

- id: trump_tariff_shock
  name_ko: 트럼프 대중 100% 관세 충격
  name_en: Trump 100% China Tariff Shock
  event_date: 2025-10-10
  category: regulation
  region: global
  description: 중국의 희토류 수출 통제 강화 이후, 트럼프 대통령이 중국산 수입품에 100% 관세를 부과하겠다고 발표. 위험자산 전반이 흔들리며 암호화폐도 영향권에 들어감.
  source_url: https://apnews.com/article/trump-xi-china-cc47e258cfc6336dfddcc20fa67a3642

- id: us_iran_war
  name_ko: 미국-이란 전쟁 발발
  name_en: US-Iran War Outbreak
  event_date: 2026-02-28
  category: crisis
  region: global
  description: 미국과 이스라엘의 대이란 공습으로 전쟁이 본격화되며 지정학적 위험이 급등. 에너지·위험자산 시장 전반이 크게 흔들림.
  source_url: https://en.wikipedia.org/wiki/2026_Iran_war

- id: trump_crypto_executive_order
  name_ko: 트럼프 암호화폐 행정명령
  name_en: Trump Crypto Executive Order
  event_date: 2025-01-23
  category: regulation
  region: global
  description: 트럼프 대통령이 미국의 암호화폐 친화 정책을 명문화한 행정명령에 서명.
  source_url: https://www.whitehouse.gov/fact-sheets/2025/01/fact-sheet-executive-order-to-establish-united-states-leadership-in-digital-financial-technology/
```

---

## 한국 이벤트 (6개)

```yaml
- id: kr_kimchi_premium_2017
  name_ko: 김치프리미엄 정점 (2017)
  name_en: Kimchi Premium Peak 2017
  event_date: 2017-12-17
  category: mania
  region: kr
  description: 한국 거래소의 BTC 가격이 글로벌 대비 50% 이상 비싼 김치프리미엄이 정점에 도달. 투기 광풍.
  source_url: https://en.wikipedia.org/wiki/Kimchi_premium

- id: kr_ico_ban
  name_ko: ICO 전면 금지
  name_en: Korea ICO Ban
  event_date: 2017-09-29
  category: regulation
  region: kr
  description: 금융위원회가 모든 형태의 ICO를 금지한다고 발표. 한국 발행 토큰 프로젝트들이 해외로 이전.
  source_url: https://www.coindesk.com/markets/2017/09/29/south-korean-regulator-issues-ico-ban

- id: kr_upbit_hack_2019
  name_ko: 업비트 해킹
  name_en: Upbit Hack 2019
  event_date: 2019-11-27
  category: crisis
  region: kr
  description: 업비트 핫월렛에서 약 342,000 ETH(당시 $50M)가 유출. 한국 최대 거래소의 보안 사고.
  source_url: https://en.wikipedia.org/wiki/Upbit

- id: kr_special_act
  name_ko: 특금법 시행
  name_en: Korean Special Reporting Act
  event_date: 2021-03-25
  category: regulation
  region: kr
  description: 가상자산사업자(VASP) 신고제 도입. 미신고 거래소 다수 폐쇄, 시장 정리 가속.
  source_url: https://www.coindesk.com/policy/2021/04/01/s-koreas-crypto-rules-might-only-help-the-big-4-exchanges

- id: kr_terra_aftermath
  name_ko: 테라 사태 한국 여파
  name_en: Korean Terra Aftermath
  event_date: 2022-05-19
  category: crisis
  region: kr
  description: 테라폼랩스 본사가 한국에 있어 국내 투자자 피해 집중. 권도형 수배 시작.
  source_url: https://www.coindesk.com/policy/2022/06/01/south-korean-government-to-form-digital-assets-committee-in-response-to-terra-collapse-report

- id: kr_user_protection_act
  name_ko: 가상자산 이용자 보호법 시행
  name_en: Virtual Asset User Protection Act
  event_date: 2024-07-19
  category: regulation
  region: kr
  description: 한국 최초의 가상자산 전용 이용자 보호 법률 시행. 시세조종/미공개정보이용 처벌 근거 마련.
  source_url: https://www.loc.gov/item/global-legal-monitor/2024-07-18/south-korea-act-to-regulate-cryptocurrency-markets-goes-into-effect/
```

---

## 이벤트 추가/수정 절차

1. 사용자(PM)가 새 이벤트 후보를 제안.
2. Codex는 **임의로 추가하지 않는다**. 카테고리/날짜/설명을 사용자와 함께 확정.
3. 위 YAML 형식대로 적절한 섹션(글로벌/한국)에 추가.
4. `pnpm --filter pipelines run reload-events` 또는 동등한 명령으로 DB 재적재.
5. `.ref/DECISIONS.md`에 추가 사유 기록.
