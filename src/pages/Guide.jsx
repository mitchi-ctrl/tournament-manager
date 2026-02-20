import React from 'react';
import { BookOpen, Trophy, Edit, Shield, Info, AlertTriangle, User, MessageCircle, Settings, XCircle } from 'lucide-react';

const Guide = () => {
    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', marginBottom: '2rem' }}>
                <BookOpen size={32} color="#eab308" /> サイトの使い方
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* 利用者への説明 / Disclaimers */}
                <section className="card" style={{ border: '1px solid #ef444430', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', borderBottom: '1px solid #ef444440', paddingBottom: '0.5rem' }}>
                        <XCircle size={24} /> 利用者への説明（免責事項）
                    </h2>
                    <div style={{ padding: '0.5rem' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>本サービスをご利用になる前に必ずお読みください。</p>
                        <ul style={{ lineHeight: '1.8', color: '#d1d5db' }}>
                            <li><strong>自己責任での利用:</strong> 本サイトは非営利目的で運営されており、利用に伴う一切の損害について責任を負いかねます。</li>
                            <li><strong>費用の負担:</strong> 運営側でサーバー費用などの維持費を永続的に負担する保証はありません。予告なくサービスが停止・終了する場合があります。</li>
                            <li><strong>個人情報の提供:</strong> 本サイトは個人情報の収集や保持を想定していません。万が一、利用者が個人情報を入力し、それが公開または流出した場合も、一切の責任を負いません。</li>
                            <li><strong>利用の判断:</strong> 上記内容をすべて了承した上で、ユーザー自身の自己判断において利用をお願いいたします。</li>
                        </ul>
                    </div>
                </section>

                {/* 使い方 / Usage for Viewers */}
                <section className="card">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                        <User size={24} /> 閲覧・参加される方へ
                    </h2>
                    <div style={{ padding: '0.5rem' }}>
                        <p>大会情報を閲覧したり、チームとして参加したりする場合のガイドです。</p>
                        <ul style={{ lineHeight: '1.8', color: '#d1d5db' }}>
                            <li><strong>大会の表示:</strong> ホーム画面で大会を表示するには、管理者が発行する<strong>「シェアコード」</strong>を入力して、その管理者をフォローする必要があります。</li>
                            <li><strong>大会への参加:</strong> シェアコードで表示された大会では、誰でも「チーム登録」や「メンバー登録」を行うことができます。</li>
                            <li><strong>閲覧可能な情報:</strong> 各大会の「順位表」「キルランキング」「チーム一覧（ロースター）」「チャット」を自由に閲覧できます。</li>
                        </ul>
                    </div>
                </section>

                {/* 管理者 / Admin Guide */}
                <section className="card">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                        <Shield size={24} /> 管理者の方へ (Admin)
                    </h2>
                    <div style={{ padding: '0.5rem' }}>
                        <p>大会を主催・管理するための機能です。</p>
                        <ul style={{ lineHeight: '1.8', color: '#d1d5db' }}>
                            <li><strong>権限の取得:</strong> 管理者権限（大会作成機能）を利用するには、スーパー管理者に連絡して権限の割り振りを依頼する必要があります。</li>
                            <li><strong>管理の範囲:</strong> 管理者は大会を作成し、管理することができますが、操作可能なのは<strong>自分が開催（作成）した大会のみ</strong>となります。</li>
                            <li><strong>結果の反映:</strong> 各ラウンドの順位やキル数を入力することで、リアルタイムに順位表へ反映されます。</li>
                        </ul>
                    </div>
                </section>

                {/* 機能面 / Technical Features */}
                <section className="card">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#eab308', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                        <Settings size={24} /> 機能・サポートについて
                    </h2>
                    <div style={{ padding: '0.5rem' }}>
                        <ul style={{ lineHeight: '1.8', color: '#d1d5db' }}>
                            <li><strong>ステータス管理:</strong> 大会のステータス（「準備中」「開催中」「終了」）を切り替えることができます。状況に合わせて更新してください。</li>
                            <li><strong>同時編集について:</strong> 同時に複数の端末から同じ大会の結果入力を編集したい場合は、<strong>同じアカウント（ID）</strong>でログインしている必要があります。</li>
                            <li><strong>お問い合わせ:</strong> 機能面でわからないことや不具合がある場合は、Xアカウント <strong>「@mmm_mitchi」</strong> へDM等でご連絡ください。</li>
                        </ul>
                    </div>
                </section>

                <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '0.9rem' }}>
                    <p>GameTourney Management System v1.1 - Release Candidate</p>
                </div>
            </div>
        </div>
    );
};

export default Guide;
