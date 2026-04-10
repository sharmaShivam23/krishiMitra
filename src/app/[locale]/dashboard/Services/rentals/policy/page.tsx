'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Tractor, Scale, AlertTriangle, ArrowLeft, Clock, Building2 } from 'lucide-react';
import Link from 'next/link';

const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function RentalPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-600/10 -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-4xl mx-auto px-4 py-16 relative z-10">
          <Link href="/dashboard/Services" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-emerald-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Equipment
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
              <Scale className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Equipment Rental Policy</h1>
              <p className="text-gray-400 text-sm font-bold mt-1">Terms of Service, Liability & Protection Coverage</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-6 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg">
              <Clock className="w-3 h-3 text-emerald-400" /> Effective: April 2026
            </span>
            <span className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg">
              <FileText className="w-3 h-3 text-emerald-400" /> Version 2.0
            </span>
            <span className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg">
              <Building2 className="w-3 h-3 text-emerald-400" /> Jurisdiction: India
            </span>
          </div>
        </div>
      </div>

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-8"
        >
          {/* Important Notice */}
          <motion.div variants={fadeIn} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-amber-900">IMPORTANT LEGAL NOTICE</h3>
              <p className="text-sm text-amber-700 mt-1 leading-relaxed">This document constitutes a legally binding agreement between all parties using the KrishiMitra Equipment Rental Platform. By submitting a rental booking request, you acknowledge that you have read, understood, and agree to be bound by all terms, conditions, and provisions set forth herein. If you do not agree to any provision of this Policy, you must refrain from using the rental services.</p>
            </div>
          </motion.div>

          {/* TOC */}
          <motion.div variants={fadeIn} className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Table of Contents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {[
                '1. Definitions & Interpretation',
                '2. Equipment Condition & Inspection Protocol',
                '3. Liability for Damages',
                '4. Protection Plan Coverage & Exclusions',
                '5. Security Deposit Framework',
                '6. Dispute Resolution Mechanism',
                '7. Cancellation & Refund Policy',
                '8. Limitation of Liability',
                '9. Governing Law & Jurisdiction'
              ].map((item, i) => (
                <a key={i} href={`#section-${i + 1}`} className="text-emerald-700 font-bold hover:text-emerald-800 hover:underline underline-offset-2 transition-colors py-1">{item}</a>
              ))}
            </div>
          </motion.div>

          {/* Sections */}
          <PolicySection id="section-1" number="1" title="DEFINITIONS & INTERPRETATION" icon={<FileText className="w-5 h-5" />}>
            <p><strong>1.1. "Platform"</strong> refers to KrishiMitra, the digital intermediary platform owned and operated by KrishiMitra Technologies Pvt. Ltd., registered under the Companies Act, 2013, facilitating peer-to-peer equipment rental transactions between registered agricultural users across the territory of India.</p>
            <p><strong>1.2. "Equipment Owner"</strong> (hereinafter referred to as "Lessor") means any registered user of the Platform who has listed farming equipment, agricultural machinery, implements, or related assets for rental through the Platform, and who retains legal ownership of the said equipment at all times during the rental period.</p>
            <p><strong>1.3. "Renter"</strong> (hereinafter referred to as "Lessee") means any registered user of the Platform who submits a booking request through the Platform to obtain temporary possession and use of the Equipment for the specified Rental Period in accordance with these terms.</p>
            <p><strong>1.4. "Rental Period"</strong> means the duration commencing from the confirmed Handover Date and concluding on the agreed Return Date as specified in the booking confirmation record maintained on the Platform, inclusive of both dates.</p>
            <p><strong>1.5. "Security Deposit"</strong> means the refundable monetary amount collected from the Lessee prior to equipment handover, calculated as a percentage of the Total Rental Amount as determined by the prevailing Platform configuration, held as security against damage, loss, unauthorized modification, or breach of these terms.</p>
            <p><strong>1.6. "Protection Plan"</strong> means the optional damage coverage tier selected by the Lessee at the time of booking, which determines the extent and quantum of coverage for verified accidental damage claims arising during the Rental Period.</p>
            <p><strong>1.7. "Damage Claim"</strong> means a formal report submitted by the Lessor through the Platform alleging damage to, deterioration of, or loss of the Equipment during the Rental Period, supported by photographic evidence and a monetary estimate of the repair or replacement cost.</p>
          </PolicySection>

          <PolicySection id="section-2" number="2" title="EQUIPMENT CONDITION & INSPECTION PROTOCOL" icon={<Tractor className="w-5 h-5" />}>
            <p><strong>2.1.</strong> The Lessor warrants and represents that all equipment listed on the Platform is: (a) in the condition as accurately described in the listing; (b) mechanically operable and free from defects that would render it unfit for its intended agricultural purpose; (c) compliant with all applicable safety regulations and standards; and (d) legally owned by the Lessor with no encumbrances preventing its rental.</p>
            <p><strong>2.2. Pre-Handover Inspection:</strong> A mandatory Pre-Handover Inspection shall be conducted by the Lessor <em>prior to</em> equipment transfer. The Lessor shall upload to the Platform photographic evidence (minimum four (4) photographs from distinct angles) documenting the equipment&apos;s condition at the time of handover. This photographic record, together with the condition rating assigned by the Lessor, shall constitute the <strong>Baseline Condition Record</strong> and shall serve as the primary evidentiary reference for any subsequent damage assessment.</p>
            <p><strong>2.3. Post-Return Inspection:</strong> A mandatory Post-Return Inspection shall be conducted by the Lessor upon the return of the equipment. The Lessor shall upload to the Platform photographic evidence documenting the equipment&apos;s condition upon return within twenty-four (24) hours of the equipment being returned to the Lessor&apos;s possession.</p>
            <p><strong>2.4. Deemed Acceptance:</strong> The Lessee acknowledges and agrees that failure to dispute, challenge, or raise objections to the Pre-Handover Inspection record within two (2) hours of taking physical receipt of the equipment shall constitute <strong>irrevocable acceptance</strong> of the documented Baseline Condition Record, and the Lessee shall thereafter be estopped from challenging the pre-handover condition of the equipment.</p>
            <p><strong>2.5.</strong> Both parties agree that the inspection records maintained on the Platform shall constitute <strong>admissible evidence</strong> in any dispute resolution proceedings under Section 6 of this Policy.</p>
          </PolicySection>

          <PolicySection id="section-3" number="3" title="LIABILITY FOR DAMAGES" icon={<AlertTriangle className="w-5 h-5" />}>
            <p><strong>3.1.</strong> The Lessee shall be <strong>solely, exclusively, and unconditionally liable</strong> for any and all damage to, deterioration of, or loss of the Equipment that occurs during the Rental Period, howsoever caused, whether by act, omission, negligence, or accident, except for the following expressly enumerated exceptions:</p>
            <ul className="list-disc ml-6 space-y-2 text-gray-600">
              <li><strong>Normal Wear and Tear:</strong> Normal wear and tear consistent with the equipment&apos;s intended agricultural use and the duration of the Rental Period, as determined by reasonable industry standards;</li>
              <li><strong>Pre-existing Defects:</strong> Defects, damage, or deterioration that is documented in and attributable to the Pre-Handover Inspection Baseline Condition Record;</li>
              <li><strong>Force Majeure:</strong> Damage arising directly and solely from force majeure events including but not limited to natural disasters, floods, cyclones, earthquakes, lightning strikes, hailstorms, or government-mandated restrictions, <em>provided that</em> the Lessee demonstrates through credible evidence that reasonable care and precautionary measures were exercised to protect the Equipment.</li>
            </ul>
            <p><strong>3.2. Damage Claim Procedure:</strong> In the event of damage, the Lessor shall file a formal Damage Claim through the Platform within forty-eight (48) hours of completing the Post-Return Inspection, specifying: (a) a detailed description of the nature and extent of damage; (b) photographic evidence clearly depicting the damage; (c) an itemized estimate of the repair or replacement cost from a qualified mechanic or authorized service center; and (d) any other supporting documentation.</p>
            <p><strong>3.3. Quantum of Damage Assessment:</strong> The quantum of damage shall be determined using the <strong>lower of</strong> the following two methodologies: (i) the actual, verified cost of repair necessary to restore the Equipment to its Pre-Handover Baseline Condition, OR (ii) the diminution in fair market value of the Equipment attributable to the damage, as assessed by the Platform Administrator using reasonable commercial judgment.</p>
            <p><strong>3.4. Liability Calculation Formula:</strong> The Lessee&apos;s net financial liability shall be calculated as: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">[Total Verified Claim Amount] − [Protection Plan Coverage Amount] = [Lessee Liability]</code>. The resulting Lessee Liability amount shall be deducted from the Security Deposit. Any shortfall between the Lessee Liability and the available Security Deposit balance shall remain payable by the Lessee within seven (7) business days of the damage claim resolution.</p>
          </PolicySection>

          <PolicySection id="section-4" number="4" title="PROTECTION PLAN COVERAGE & EXCLUSIONS" icon={<Shield className="w-5 h-5" />}>
            <h4 className="font-bold text-gray-900 mt-2">4.1. No Protection (Free Tier)</h4>
            <p className="text-gray-600">Zero (0%) damage coverage. The Lessee bears one hundred percent (100%) liability for all verified damages. The full Security Deposit amount is at risk of forfeiture. Only the basic terms and conditions of this Policy shall apply. No priority or expedited dispute resolution is available.</p>
            
            <h4 className="font-bold text-gray-900 mt-4">4.2. Standard Protection (5% of Rental Amount)</h4>
            <p className="text-gray-600">Covers up to fifty percent (50%) of verified damage claims up to the ceiling of the Total Rental Amount. Normal wear and tear (as defined in Section 3.1) is fully covered and excluded from damage assessment. Priority dispute resolution with a guaranteed adjudication timeline of forty-eight (48) hours from escalation.</p>
            
            <h4 className="font-bold text-gray-900 mt-4">4.3. Premium Protection (12% of Rental Amount)</h4>
            <p className="text-gray-600">Covers up to ninety percent (90%) of verified damage claims up to a ceiling of twice (2x) the Total Rental Amount. Includes coverage for mechanical breakdown occurring during normal operation (excluding pre-existing defects). Express dispute resolution with a guaranteed adjudication timeline of twenty-four (24) hours from escalation. The Lessee&apos;s maximum out-of-pocket liability is capped at ten percent (10%) of the verified claim amount.</p>
            
            <h4 className="font-bold text-gray-900 mt-4">4.4. Universal Exclusions</h4>
            <p className="text-gray-600">Protection Plan coverage, regardless of the tier selected, shall <strong>NOT extend to</strong> and shall expressly exclude:</p>
            <ul className="list-[lower-alpha] ml-6 space-y-1 text-gray-600">
              <li>Intentional damage, willful destruction, or gross negligence by the Lessee or any person under the Lessee&apos;s control;</li>
              <li>Use of the Equipment for purposes other than its intended agricultural use as described in the listing;</li>
              <li>Sub-letting, re-renting, or transfer of the Equipment to any third party without the express written consent of the Lessor;</li>
              <li>Damage caused while the Equipment is being operated by an unqualified or unauthorized person;</li>
              <li>Damage caused while the operator is under the influence of alcohol, narcotics, or any intoxicating substance;</li>
              <li>Theft, misappropriation, or abandonment of the Equipment;</li>
              <li>Cosmetic damage that does not affect the structural integrity or operational capability of the Equipment;</li>
              <li>Damage to third-party property or persons arising from the use of the Equipment.</li>
            </ul>
          </PolicySection>

          <PolicySection id="section-5" number="5" title="SECURITY DEPOSIT FRAMEWORK" icon={<Shield className="w-5 h-5" />}>
            <p><strong>5.1. Collection:</strong> The Security Deposit, calculated as the applicable percentage of the Total Rental Amount as configured on the Platform (default: twenty-five percent (25%)), shall be collected by the Lessor from the Lessee <strong>prior to</strong> the physical handover of the Equipment. Under no circumstances shall the Equipment be handed over without confirmed collection of the Security Deposit.</p>
            <p><strong>5.2. Refund Timeline:</strong> Subject to Section 5.3, the Security Deposit (or the balance remaining after any permitted deductions) shall be refunded to the Lessee within forty-eight (48) hours of: (a) the Post-Return Inspection being completed and no Damage Claim being filed; OR (b) the final resolution of any Damage Claim, whichever is later.</p>
            <p><strong>5.3. Grounds for Full Forfeiture:</strong> The Security Deposit shall be <strong>forfeited in its entirety</strong>, without right of refund, if the Lessee:</p>
            <ul className="list-[lower-alpha] ml-6 space-y-1 text-gray-600">
              <li>Fails to return the Equipment by the agreed Return Date without obtaining the Lessor&apos;s prior written consent for an extension;</li>
              <li>Returns the Equipment in a condition materially and substantially worse than documented in the Pre-Handover Baseline Condition Record;</li>
              <li>Is found to have sub-let, transferred, or made the Equipment available to unauthorized third parties;</li>
              <li>Has used the Equipment for illegal activities or purposes.</li>
            </ul>
            <p><strong>5.4.</strong> The Platform shall maintain a transparent record of all deposit transactions, deductions, and refunds accessible to both parties through their respective dashboards.</p>
          </PolicySection>

          <PolicySection id="section-6" number="6" title="DISPUTE RESOLUTION MECHANISM" icon={<Scale className="w-5 h-5" />}>
            <p><strong>6.1. Amicable Resolution (Tier 1):</strong> In the event of any dispute, controversy, or claim arising out of or in connection with the rental transaction, the parties shall first attempt to resolve the matter amicably through direct communication via the Platform&apos;s messaging system within seventy-two (72) hours of the dispute arising.</p>
            <p><strong>6.2. Platform Adjudication (Tier 2):</strong> If no resolution is reached within the seventy-two (72) hour Amicable Resolution period, either party may escalate the dispute to KrishiMitra Platform Administration for formal adjudication by submitting a written statement of the dispute through the Platform.</p>
            <p><strong>6.3. Binding Decision:</strong> The Platform Administrator&apos;s decision on all disputed matters, including but not limited to the final damage quantum, deposit deductions, liability apportionment, and protection plan applicability, shall be <strong>final, conclusive, and binding</strong> on both parties. Both parties waive their right to challenge or appeal the Administrator's decision except in cases of manifest fraud or procedural irregularity.</p>
            <p><strong>6.4. Platform Sanctions:</strong> The Platform reserves the unqualified right to suspend, restrict, or permanently terminate the account of any user found to have: (a) acted in bad faith during any rental transaction; (b) submitted fraudulent, misleading, or exaggerated damage claims; (c) willfully misrepresented equipment condition in listings or inspections; or (d) violated any provision of this Policy.</p>
          </PolicySection>

          <PolicySection id="section-7" number="7" title="CANCELLATION & REFUND POLICY" icon={<Clock className="w-5 h-5" />}>
            <p><strong>7.1. Free Cancellation Window:</strong> Either party may cancel a confirmed rental booking <strong>without penalty or charge</strong> if written cancellation notice is provided through the Platform at least twenty-four (24) hours prior to the agreed Handover Date and Time.</p>
            <p><strong>7.2. Late Cancellation:</strong> Cancellation made less than twenty-four (24) hours before the agreed Handover Date may, at the Platform&apos;s sole discretion, result in a cancellation fee equal to one (1) day&apos;s rental rate, payable by the cancelling party to the non-cancelling party as compensation for lost opportunity.</p>
            <p><strong>7.3. No-Show Provision:</strong> If the Lessee fails to collect the Equipment on the agreed Handover Date without prior communication or notification through the Platform, the booking shall be automatically cancelled after twenty-four (24) hours, and the Lessor shall be released from all obligations under the booking with no liability whatsoever.</p>
            <p><strong>7.4. Lessor Cancellation:</strong> If the Lessor cancels a confirmed booking without justifiable cause (equipment breakdown, emergency, force majeure), the Lessor&apos;s reliability rating on the Platform may be adversely affected, and repeat violations may result in listing restrictions.</p>
          </PolicySection>

          <PolicySection id="section-8" number="8" title="LIMITATION OF LIABILITY" icon={<Building2 className="w-5 h-5" />}>
            <p><strong>8.1. Intermediary Status:</strong> KrishiMitra operates exclusively as an <strong>Information Technology intermediary</strong> within the meaning of Section 2(1)(w) of the Information Technology Act, 2000, and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. The Platform facilitates connections between equipment owners and renters but does not own, possess, operate, maintain, insure, or exercise control over any equipment listed hereon.</p>
            <p><strong>8.2. Exclusion of Liability:</strong> To the maximum extent permitted by applicable law, the Platform shall not be liable for:</p>
            <ul className="list-[lower-alpha] ml-6 space-y-1 text-gray-600">
              <li>The condition, fitness for purpose, merchantability, safety, or legality of any equipment listed on the Platform;</li>
              <li>Personal injury, bodily harm, death, or property damage arising from the use, operation, or transportation of rental equipment;</li>
              <li>The accuracy, completeness, or truthfulness of information, descriptions, or representations provided by users;</li>
              <li>Any losses, whether direct, indirect, incidental, special, consequential, punitive, or exemplary, arising from or in connection with rental transactions;</li>
              <li>Any interruption, delay, or failure of the Platform's services.</li>
            </ul>
            <p><strong>8.3. Risk Acknowledgment:</strong> Both parties hereby acknowledge and agree that they enter into rental transactions at their own risk and that the exercise of due diligence regarding equipment condition, operator competence, legal compliance, and fitness for intended purpose is the <strong>sole and exclusive responsibility</strong> of the transacting parties.</p>
          </PolicySection>

          <PolicySection id="section-9" number="9" title="GOVERNING LAW & JURISDICTION" icon={<Scale className="w-5 h-5" />}>
            <p><strong>9.1.</strong> This Policy and all rental transactions facilitated through the Platform shall be governed by and construed in accordance with the substantive and procedural laws of the Republic of India, without regard to conflict of law principles.</p>
            <p><strong>9.2.</strong> Subject to Section 6 (Dispute Resolution), any legal action, suit, or proceeding arising out of or in connection with this Policy or any rental transaction shall be subject to the <strong>exclusive jurisdiction</strong> of the competent courts situated at New Delhi, India, and both parties hereby submit to such jurisdiction.</p>
            <p><strong>9.3. Severability:</strong> If any provision, clause, or sub-clause of this Policy is found by a court of competent jurisdiction to be invalid, illegal, or unenforceable, such finding shall not affect the validity or enforceability of the remaining provisions, which shall continue in full force and effect.</p>
            <p><strong>9.4. Entire Agreement:</strong> This Policy, together with the specific booking confirmation details, constitutes the entire agreement between the parties pertaining to the rental transaction and supersedes all prior or contemporaneous negotiations, discussions, representations, or agreements, whether written or oral.</p>
          </PolicySection>

          {/* Footer */}
          <motion.div variants={fadeIn} className="bg-gray-100 rounded-2xl p-6 text-center text-gray-500 text-xs font-medium space-y-2">
            <p><strong>Document Version:</strong> 2.0 • <strong>Last Updated:</strong> April 2026</p>
            <p>© 2026 KrishiMitra Technologies Pvt. Ltd. All rights reserved.</p>
            <p className="text-gray-400">This digital document shall have the same legal force and effect as a physical document bearing manuscript signatures.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function PolicySection({ id, number, title, icon, children }: { id: string; number: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section
      id={id}
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
    >
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">{icon}</div>
        <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">{number}. {title}</h3>
      </div>
      <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </motion.section>
  );
}
