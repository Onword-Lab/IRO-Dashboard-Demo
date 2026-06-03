// ── Core domain types ────────────────────────────────────────────────────────
// Projects are now OWNED BY THE DASHBOARD (created/edited/deleted in-app and
// persisted in our own store — see lib/projects-store.ts). Notion & Google Drive
// are OPTIONAL attachments the user picks per project, not the source of truth.

export type ProjectType = "Agency" | "Education" | "Content" | "Internal" | "Other";
export type ProjectStatus = "Planned" | "In progress" | "Done" | "On hold" | "Cancelled";
export type TaskStatus = "Todo" | "Doing" | "Review" | "Done";
export type Priority = "High" | "Medium" | "Low";

export const PROJECT_TYPES: ProjectType[] = ["Agency", "Education", "Content", "Internal", "Other"];
export const PROJECT_STATUSES: ProjectStatus[] = [
  "Planned", "In progress", "Done", "On hold", "Cancelled",
];

export interface Person {
  id: string;
  name: string;
  email?: string;
}

// A Notion page or database attached to a project (picked manually).
export interface NotionRef {
  kind: "page" | "database";
  id: string;
  title: string;
  url: string;
}

// One item inside a Notion page/database render: either a text line, or a
// nested page/database the user can expand/drill into.
export type NotionItem =
  | { node: "text"; md: string }
  | { node: "ref"; ref: NotionRef };

// A Google Drive folder attached to a project (picked manually).
export interface DriveRef {
  id: string;
  name: string;
  url?: string;
}

export interface Project {
  id: string;                 // uuid, used in URLs
  code?: string;              // e.g. "26-001"
  name: string;
  client?: string;
  type: ProjectType;
  status: ProjectStatus;
  owner?: string;             // 담당자 — free text (comma-separated names ok)
  revenue?: number;           // 누적 매출
  startDate?: string;         // YYYY-MM-DD
  endDate?: string;
  description?: string;
  notion?: NotionRef | null;  // attached Notion page/database
  drive?: DriveRef | null;    // attached Drive folder
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
}

export interface FileNode {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  owner?: string;
  driveUrl?: string;
  source: "drive" | "notion" | "md" | "commit" | "session";
  children?: FileNode[];
}

export interface DriveFolder {
  id: string;
  name: string;
  viewUrl: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: Priority;
  assignees: Person[];
  dueDate?: string;
  projectId?: string;     // slug of the linked project
  projectName?: string;
  tags: string[];
  notes?: string;
  source?: string;
  notionUrl: string;
}

// ── Feature-expansion domain types (v0.3) ────────────────────────────────────
// Calendar · Mail · Contacts(명함) · Tax(세금) · Banking(입출금) · Code(GitHub)

// 📅 Calendar
export interface CalEvent {
  id: string;
  title: string;
  start: string;            // ISO datetime
  end?: string;             // ISO datetime
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  calendar?: string;        // calendar display name
  htmlLink?: string;        // open in Google Calendar
}

// ✉️ Mail (Gmail) — two work inboxes
export type MailAccount = "sihoon" | "jinho";
export interface MailThread {
  id: string;
  account: MailAccount;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;             // ISO datetime
  unread?: boolean;
  labels?: string[];
  permalink?: string;
}

// 🪪 Contacts (명함)
export type ContactSource = "manual" | "card" | "google";
export interface Contact {
  id: string;
  name: string;
  company?: string;
  title?: string;
  phones?: string[];
  emails?: string[];
  note?: string;
  source: ContactSource;
  photoUrl?: string;
}

// 🧾 Tax (세금 / 세금계산서)
export type TaxInvoiceType = "sales" | "purchase";
export type TaxInvoiceStatus = "issued" | "sent" | "draft";
export interface TaxItem {
  name: string;             // 품명
  qty: number;              // 수량
  unitPrice: number;        // 단가
  supplyAmount: number;     // 공급가액 = 수량 × 단가
  vat: number;              // 세액 = 공급가액 × 10%
}
export interface TaxInvoice {
  id: string;
  type: TaxInvoiceType;     // 매출(sales) / 매입(purchase)
  issueDate: string;        // YYYY-MM-DD
  partnerName: string;
  partnerBizNo?: string;    // 사업자번호
  partnerCeo?: string;      // 공급받는자 대표자
  partnerEmail?: string;
  items?: TaxItem[];        // 품목 (정발행 입력)
  supplyAmount: number;     // 공급가액 합계
  vat: number;              // 세액 합계
  total: number;            // 합계
  taxType?: "과세" | "영세" | "면세";
  receiveType?: "영수" | "청구";
  status: TaxInvoiceStatus;
  ntsConfirmNum?: string;   // 국세청 승인번호
  createdAt?: string;
}

// 현금영수증
export type CashReceiptPurpose = "소득공제" | "지출증빙";
export interface CashReceipt {
  id: string;
  tradeDate: string;            // YYYY-MM-DD
  purpose: CashReceiptPurpose;  // 소득공제(개인) / 지출증빙(사업자)
  identityNum: string;          // 휴대폰번호(소득공제) / 사업자번호(지출증빙)
  supplyAmount: number;
  vat: number;
  total: number;
  status: "issued" | "cancelled";
  ntsConfirmNum?: string;
  createdAt: string;
}

// 내 사업자(공급자) 정보 — 발행 시 자동으로 채워짐 (온보딩에서 1회 등록)
export interface IssuerProfile {
  bizNo?: string;
  corpName?: string;   // 상호
  ceoName?: string;    // 대표자
  address?: string;
  bizType?: string;    // 업태
  bizItem?: string;    // 종목
  email?: string;
  certRegistered: boolean;  // 전자세금용 인증서 등록 여부 (실발행용; 테스트 모드는 불필요)
  updatedAt?: string;
}

// 💸 Banking (입출금) — dashboard-owned ledger
export type TxDirection = "in" | "out";
export type TxSource = "manual" | "csv" | "receipt" | "bank";
export interface Tx {
  id: string;
  date: string;             // YYYY-MM-DD
  direction: TxDirection;   // 입금(in) / 출금(out)
  counterparty: string;     // 거래처
  amount: number;
  balance?: number;         // 잔액
  category?: string;
  memo?: string;
  source: TxSource;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// 💻 Code (GitHub)
export interface Repo {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  updatedAt: string;        // ISO
  openIssues?: number;
  url: string;
  private?: boolean;
  language?: string;
}
export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;             // ISO
  repo: string;
  url: string;
}
export interface PullRequest {
  id: string;
  number: number;
  title: string;
  repo: string;
  author: string;
  state: "open" | "closed" | "merged";
  updatedAt: string;        // ISO
  url: string;
}

// 💬 Slack
export interface SlackChannel {
  id: string;
  name: string;
  isPrivate?: boolean;
  topic?: string;
  memberCount?: number;
  unread?: number;
}
export interface SlackMessage {
  ts: string;               // Slack timestamp — doubles as the message id
  channel: string;          // channel id
  userId: string;
  userName: string;
  text: string;
  date: string;             // ISO
  threadTs?: string;        // parent ts if this is a thread reply
  replyCount?: number;      // on a parent: number of replies
  reactions?: { emoji: string; count: number }[];
}

// 🛒 Commerce (유통/커머스) — 셀러 API 통합 (스마트스토어·쿠팡·11번가·자사몰)
export type Market = "스마트스토어" | "쿠팡" | "11번가" | "자사몰";
export type OrderStatus = "결제완료" | "상품준비중" | "배송중" | "배송완료" | "취소" | "반품";
export interface CommerceOrder {
  id: string;               // 주문번호
  orderedAt: string;        // 주문일시
  market: Market;
  sku: string;
  productName: string;
  option?: string;
  qty: number;
  unitPrice: number;        // 판매단가
  amount: number;           // 결제금액 = qty × unitPrice
  buyer: string;            // 주문자
  phone: string;            // 연락처
  status: OrderStatus;
}

export type ShipStatus = "집화" | "간선상차" | "배송출발" | "배송중" | "배송완료";
export interface ShippingInfo {
  orderId: string;
  recipient: string;
  address: string;
  courier: string;          // 택배사
  trackingNo: string;       // 운송장번호
  shippedAt?: string;
  status: ShipStatus;
  eta?: string;             // 예상도착
  memo?: string;
}

export type StockStatus = "정상" | "부족" | "품절";
export interface InventoryItem {
  sku: string;
  productName: string;
  option?: string;
  stock: number;            // 현재고
  safetyStock: number;      // 안전재고
  incoming?: number;        // 입고예정
  costPrice: number;        // 매입가
  salePrice: number;        // 판매가
}

export interface SalesDay {
  date: string;
  orders: number;
  revenue: number;          // 매출액
  fee: number;              // 마켓수수료
  adCost: number;           // 광고비
  refund: number;           // 환불액
  // 순이익(net) = revenue − fee − adCost − refund  (계산은 화면에서)
}

// 🧾 거래처(공급받는자) 마스터 + 계좌/카드 연동(mock) — 세금계산서 자동완성용
export interface Partner {
  id: string;
  name: string;             // 상호
  bizNo: string;            // 사업자등록번호
  ceoName?: string;         // 대표자
  email?: string;
  address?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConnectionKind = "bank" | "card";
export interface BankAccount {
  id: string;
  kind: ConnectionKind;     // 계좌 / 카드
  label: string;            // 은행명 / 카드사명
  accountNo: string;        // 표시용(마스킹된 번호)
  holder?: string;          // 예금주
  addedAt: string;
}

export type TxnSource = "bank" | "card";
export interface BankTxn {
  id: string;
  accountId: string;
  date: string;             // YYYY-MM-DD
  direction: "in" | "out";  // 입금 / 출금
  counterparty: string;     // 적요 / 거래처
  amount: number;
  source: TxnSource;
  issuedInvoiceId?: string; // 세금계산서 발행 시 연결(소진 표시)
}
