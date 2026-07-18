# 배포 가이드 (5분)

이 폴더(`ssk7594-CRz/`)의 내용을 그대로 프로필 레포에 올리면 된다.

## 1. 프로필 레포 만들기
GitHub에서 **본인 아이디와 똑같은 이름**의 public 레포 생성:
- 레포 이름: `ssk7594-CRz`  (아이디와 동일해야 프로필 README로 인식됨)
- Public, README 없이 빈 레포로 생성

## 2. 파일 올리기
```bash
git clone https://github.com/ssk7594-CRz/ssk7594-CRz.git
cd ssk7594-CRz
# 이 폴더의 모든 내용(README.md, scripts/, data/, assets/, .github/)을 복사해 넣기
git add .
git commit -m "feat: terminal-style profile"
git push
```

## 3. Actions 권한 켜기
레포 → **Settings → Actions → General → Workflow permissions**
→ **Read and write permissions** 선택 후 저장.
(usage 카드·스네이크 자동 커밋에 필요)

## 4. 실제 AI 토큰 사용량 채우기
`data/usage.json` 은 지금 **샘플**이다. 본인 실사용량으로 바꾸려면 로컬에서:
```bash
bash scripts/collect-usage.sh
```
- `ccusage`(Claude Code, `~/.claude`) + `@ccusage/codex`(Codex, `~/.codex`) 로그를 읽어 집계
- `data/usage.json` 갱신 → SVG/뱃지 재렌더 → 자동 commit·push
- 로컬 로그를 읽어야 하므로 **이 스크립트는 반드시 본인 컴퓨터에서** 실행 (GitHub Actions 러너엔 로그가 없음)

### 자동화(선택) — 하루 1회 갱신
macOS `crontab -e` 에 추가:
```
0 9 * * * cd ~/path/to/ssk7594-CRz && bash scripts/collect-usage.sh >> /tmp/usage.log 2>&1
```

## 5. 잔디 스네이크
`.github/workflows/snake.yml` 이 매일 `output` 브랜치에 `snake.svg` 를 생성한다.
첫 실행은 레포 → **Actions → Generate snake → Run workflow** 로 수동 트리거하면 바로 나온다.

---

## 채워야 할 자리 (README.md 안)
- `nb07-dearcarmate-team5` 담당 파트 → `(담당 파트 채우기)` 부분
- 필요 시 프로젝트 한 줄 설명 다듬기
- 프로필 → **Customize your pins** 에서 상위 프로젝트 3~4개 고정

## 파일 구성
```
ssk7594-CRz/
├─ README.md                     # 프로필 본문
├─ SETUP.md                      # 이 문서
├─ data/
│  ├─ usage.json                 # 토큰 집계(샘플 → 실데이터)
│  ├─ badge-claude.json          # shields endpoint (자동 생성)
│  └─ badge-codex.json
├─ assets/
│  └─ ai-usage.svg               # 터미널 카드 (자동 생성)
├─ scripts/
│  ├─ collect-usage.sh           # 로컬 집계 + 커밋
│  ├─ merge-usage.mjs            # ccusage 출력 정규화
│  └─ render-card.mjs            # SVG/뱃지 렌더
└─ .github/workflows/
   ├─ update-usage-card.yml      # usage.json 변경 시 카드 재렌더
   └─ snake.yml                  # 잔디 스네이크 일일 생성
```
