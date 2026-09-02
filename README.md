# 交換日記アプリ

1対1で交換日記を行うWebアプリ。

匿名性を保ちながら、毎日の決まった時間に日記を交換し、相手の日記を読んで返信する。

## 基本フロー

1. ユーザー生成
2. 日記を書く
3. 交換相手を指定するか、自動マッチングを待つ
4. マッチング
5. Room生成
6. 相手の日記を読む
7. 返信
8. Exchange終了
9. 翌日のExchangeへ

## ユーザー

- **nickname**：表示用のニックネーム
- **userId**：内部でユーザーを識別するためのID
- **publicUserId**：交換相手を指定するときに使用する公開ID

ユーザー情報はSupabaseの`users`テーブルで管理する。

ログイン機能は現在実装しておらず、ユーザー情報はブラウザの`localStorage`にも保存する。

## 指定ポケット

交換相手を指定するための機能。

相手の`publicUserId`を入力することで、特定のユーザーを指定できる。

- 指定あり → 指定マッチング
- 指定なし → 自動マッチング
- 自分自身の公開IDは指定できない
- 指定した相手が見つからない場合は、そのSubmissionを待機状態にする

### 最近あなたを指定してくれた人

自分を指定している未マッチのユーザーを確認できる。

最新3人まで表示し、選択するとそのユーザーの公開IDを指定ポケットへ入力できる。

## ブックマーク

交換した相手を後から指定できるようにするための機能。

Room画面から相手をブックマークできる。

```text
〇〇 ABC123 ☆
```

ブックマークすると、

```text
〇〇 ABC123 ★
```

となる。

ブックマークは現在ログイン機能がないため、Supabaseではなくブラウザの`localStorage`で管理する。

保存する情報は以下。

```json
[
  {
    "publicUserId": "ABC123",
    "nickname": "〇〇"
  }
]
```

`publicUserId`を相手の識別情報として使用し、ニックネームは表示用として保存する。

## マッチング

### 指定マッチング

相互指定によってマッチングする。

```text
A → B
B → A
```

お互いが相手を指定している場合、マッチングが成立する。

一方的な指定では成立しない。

```text
A → B
B → なし
```

この場合、AのSubmissionは待機状態になる。

### 自動マッチング

指定ポケットが空の場合、自動マッチングを行う。

設定された属性・マッチング条件をもとに候補を探し、条件に合う未マッチのSubmissionとマッチングする。

自動マッチングでは、待機しているSubmissionの中から候補を探す。

### 強制マッチング

5:00の提出締切後、まだマッチングしていないSubmissionを対象に強制マッチングを行う。

通常の指定や属性などの条件は無視し、残っているSubmissionを順番に2人ずつ組み合わせる。

```text
A
B
C
D
↓
A ↔ B
C ↔ D
```

人数が奇数の場合、最後の1人は次のマッチングまで待機する。

強制マッチングを行っても、`target_public_user_id`は変更せず、ユーザーが誰を指定していたかは保持する。

## Submission

ユーザーが1回の日記を提出すると、`submissions`テーブルにSubmissionが作成される。

Submissionには以下の情報を保存する。

- 自分のユーザーID
- 日記
- 指定した相手の公開ID
- 実際にマッチしたRoom
- 提出日時

提出直後は`room_id = null`となり、マッチング待機状態になる。

マッチングが成立すると、RoomのIDが設定される。

```text
日記を提出
↓
Submission作成
↓
room_id = null
↓
マッチング
↓
Room作成
↓
room_idを設定
```

## Room

マッチング成立時に1対1のRoomを生成する。

Roomには以下の情報を保存する。

- `user_a_id`
- `user_b_id`
- `started_at`
- `ended_at`

Roomは1回の交換期間における2人のつながりを表す。

交換期間が終了すると、そのRoomのExchangeも終了する。

## Exchange

このアプリでは、**Exchangeを「2人がつながっている1日単位の交換期間」**として扱う。

Exchangeは毎日20:00に切り替わる。

```text
20:00
↓
Exchange開始
↓
日記を書く
↓
マッチング
↓
翌日5:00
提出締切
↓
翌日6:00
相手の日記公開・返信開始
↓
20:00
Exchange終了
↓
次のExchangeへ
```

1つのExchangeを、

**「自分の日記 ＋ 相手の日記 ＋ 自分の返信 ＋ 相手の返信」**

の1セットとして扱う。

## 時間

Exchangeの基準時刻は毎日20:00。

### 20:00

新しいExchangeが開始される。

日記の提出とマッチングが開始される。

### 翌日5:00

日記の提出を締め切る。

それ以降は新しいSubmissionを提出できない。

### 5:00〜6:00

未マッチのSubmissionに対して、Vercel Cronによる強制マッチングを行う。

Vercel HobbyではCronの実行時刻に最大1時間の柔軟な実行幅があるため、5:00〜5:59の間に実行される。

### 翌日6:00

相手の日記を閲覧できるようになる。

返信もこの時間から行う。

### 20:00

Exchangeが終了し、次のExchangeへ切り替わる。

## 交換日記

基本的な流れ。

```text
20:00
↓
日記を書く
↓
提出
↓
通常マッチング
↓
待機
↓
5:00
提出締切
↓
強制マッチング
↓
6:00
相手の日記公開
↓
相手の日記を読む
↓
返信する
↓
20:00
Exchange終了
↓
次のExchangeへ
```

## データ構造

現在は主に以下のSupabaseテーブルを使用する。

### users

ユーザー情報を管理する。

```text
id
public_user_id
nickname
personality_type
```

### submissions

提出された日記とマッチング状態を管理する。

```text
id
user_id
diary
target_public_user_id
room_id
created_at
```

### rooms

マッチングした2人の交換期間を管理する。

```text
id
user_a_id
user_b_id
started_at
ended_at
```

### replies

Room内での返信を管理する。

```text
id
room_id
user_id
content
reaction
created_at
```

## 強制マッチング

Vercel Cronを利用して、提出締切後に自動的に強制マッチングを実行する。

```text
20:00 JST
Exchange開始
↓
20:00〜5:00
Submission受付
↓
5:00
Submission受付終了
↓
5:00〜5:59
強制マッチング
↓
6:00
相手の日記公開
```

CronはUTC基準で設定している。

```text
0 20 * * *
```

これは日本時間では翌日5:00台に実行される設定。

## 実装

強制マッチングは以下のAPIから実行する。

```text
GET /api/force-match
```

実際のマッチング処理は`lib/forceMatch.ts`で行う。

すでに`room_id`が設定されているSubmissionは対象外になるため、同じ処理が複数回実行されても、すでにマッチング済みのSubmissionが再度マッチングされることはない。

## 現在の実装状況

- [x] ユーザー生成
- [x] ニックネーム設定
- [x] 公開ID生成
- [x] Supabaseへのユーザー保存
- [x] 日記作成
- [x] Submission作成
- [x] SupabaseへのSubmission保存
- [x] 指定マッチング
- [x] 自動マッチング
- [x] Room生成
- [x] 相手の日記取得
- [x] 返信
- [x] Room終了時間の管理
- [x] 時間制限
- [x] 5:00の提出締切
- [x] 6:00の日記公開
- [x] 強制マッチング
- [x] Vercel Cronによる自動実行
- [x] ブックマーク
- [x] 最近あなたを指定してくれた人の表示
- [x] 指定相手の選択
- [x] ブックマークの削除

## 今後検討

- 属性・マッチング条件の詳細調整
- 匿名性・安全性の強化
- ユーザー間の関係性を管理するフレンド機能
- ブックマークとフレンド機能の統合
- 通知機能
- Exchange履歴の管理
- UI/UXの改善

## マッチング処理

### 指定マッチング

```text
① 自分のSubmissionをINSERT
        ↓
② target_public_user_idがある？
        ↓ YES
③ 自分を指定している未マッチのSubmissionを探す
        ↓
④ 相手のtarget_public_user_id === 自分のpublicUserId？
        ↓ YES
⑤ RoomをINSERT
        ↓
⑥ 自分・相手のSubmissionにroom_idを設定
        ↓
⑦ ホームへ
```

### 自動マッチング

```text
① 自分のSubmissionをINSERT
        ↓
② target_public_user_idがある？
        ↓ NO
③ 自分の属性・マッチング条件を取得
        ↓
④ 条件に合う未マッチのSubmissionを探す
        ↓
⑤ 候補がいる？
        ↓ YES
⑥ RoomをINSERT
        ↓
⑦ 自分・相手のSubmissionにroom_idを設定
        ↓
⑧ ホームへ
```

### 強制マッチング

```text
① 現在のExchangeの未マッチSubmissionを取得
        ↓
② target_public_user_id・属性などの条件を無視
        ↓
③ 古いSubmissionから2人ずつ取得
        ↓
④ RoomをINSERT
        ↓
⑤ 2人のSubmissionにroom_idを設定
        ↓
⑥ 次の2人へ
```