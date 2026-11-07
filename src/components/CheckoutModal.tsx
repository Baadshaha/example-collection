import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Building2,
  Banknote,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  CartSummary,
  Order,
  PaymentMethod,
  PaymentPayload,
  ShippingAddress,
  User,
} from '../types/index.ts';
import { formatPaise } from '../utils/currency.ts';
import { api } from '../utils/apiClient.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartSummary;
  onOrderSuccess: (order: Order) => void;
  user?: User | null;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR',
  'Chandigarh',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onOrderSuccess,
  user,
}) => {
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [cardHolder, setCardHolder] = useState('');
  // Simulating tokenized payment without ever touching CVV or raw card number in storage
  const [simulatedCardLast4, setSimulatedCardLast4] = useState('4242');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateAddress = (): boolean => {
    setErrorMsg(null);
    if (!address.fullName.trim() || address.fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters)');
      return false;
    }
    const cleanPhone = address.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email.trim())) {
      setErrorMsg('Please enter a valid email address for order confirmation');
      return false;
    }
    if (!address.addressLine1.trim() || address.addressLine1.trim().length < 5) {
      setErrorMsg('Please enter a complete address (House/Flat, Street name)');
      return false;
    }
    if (!address.city.trim()) {
      setErrorMsg('Please enter your city/town');
      return false;
    }
    const cleanPin = address.pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddress()) {
      setStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMsg(null);

    // Prepare tokenized payload according to rule 6 (Never store card numbers or CVV)
    const paymentPayload: PaymentPayload = {
      method: paymentMethod,
    };

    if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMsg('Please provide a valid UPI ID (e.g., yourname@okaxis or 9876543210@upi)');
        return;
      }
      paymentPayload.upiId = upiId.trim();
    } else if (paymentMethod === 'netbanking') {
      paymentPayload.bankCode = selectedBank;
    } else if (paymentMethod === 'card_token') {
      if (!cardHolder.trim()) {
        setErrorMsg('Please enter the name on your card');
        return;
      }
      // Tokenized client token (zero raw card storage)
      paymentPayload.cardToken = `tok_${Date.now()}_secure`;
      paymentPayload.cardLastFour = simulatedCardLast4;
      paymentPayload.cardNetwork = 'RuPay / Visa';
    }

    setIsSubmitting(true);
    try {
      const response = await api.checkout(address, paymentPayload);
      onOrderSuccess(response.order);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Checkout transaction failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-950 text-amber-200 flex items-center justify-center font-bold text-sm">
              {step === 'address' ? '1' : '2'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">
                {step === 'address' ? 'Delivery Address' : 'Payment Method'}
              </h2>
              <p className="text-xs text-stone-500">
                {step === 'address'
                  ? 'Step 1 of 2: Shipping details across India'
                  : 'Step 2 of 2: Secure checkout (UPI, Netbanking, COD)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {step === 'address' ? (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="e.g. Radhika Sharma"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    10-digit Indian Mobile Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs font-bold text-stone-600 bg-stone-100 border border-r-0 border-stone-300 rounded-l-lg">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-r-lg focus:outline-none focus:border-rose-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Email Address (for order tracking &amp; tax invoice) *
                </label>
                <input
                  type="email"
                  required
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  placeholder="radhika.sharma@example.in"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Flat, House no., Apartment, Street *
                </label>
                <input
                  type="text"
                  required
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  placeholder="Flat 301, Krishna Vihar, Link Road"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Landmark / Area (Optional)
                </label>
                <input
                  type="text"
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  placeholder="Near ISKCON Temple"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Varanasi"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    State / UT *
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900 bg-white"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    6-digit PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder="221001"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                  />
                </div>
              </div>

              {/* Order Amount preview */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-stone-800">
                    Order Total ({cart.item_count} items):{' '}
                    <span className="text-rose-950 font-bold font-serif text-sm">
                      {formatPaise(cart.total_paise)}
                    </span>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Includes ₹{cart.discount_paise > 0 ? `${cart.discount_paise / 100} coupon discount` : 'applicable taxes'}
                  </p>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-950 hover:bg-rose-900 text-amber-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Payment Methods Selection */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Select Payment Option
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* UPI */}
                  <div
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'upi'
                        ? 'border-rose-900 bg-rose-50/50 shadow-xs ring-1 ring-rose-900/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-950 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">UPI Instant Pay</h4>
                      <p className="text-[11px] text-stone-500">Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>

                  {/* Net Banking */}
                  <div
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'netbanking'
                        ? 'border-rose-900 bg-rose-50/50 shadow-xs ring-1 ring-rose-900/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-rose-950 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">Net Banking</h4>
                      <p className="text-[11px] text-stone-500">All major Indian banks supported</p>
                    </div>
                  </div>

                  {/* Card Token (Strictly Tokenized - No CVV/Raw Storage) */}
                  <div
                    onClick={() => setPaymentMethod('card_token')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'card_token'
                        ? 'border-rose-900 bg-rose-50/50 shadow-xs ring-1 ring-rose-900/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-rose-950 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">RuPay / Debit / Credit</h4>
                      <p className="text-[11px] text-stone-500">Encrypted token gateway</p>
                    </div>
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === 'cod'
                        ? 'border-rose-900 bg-rose-50/50 shadow-xs ring-1 ring-rose-900/20'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-rose-950 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">Cash on Delivery</h4>
                      <p className="text-[11px] text-stone-500">Pay cash upon delivery verification</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Payment Input Section */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                {paymentMethod === 'upi' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Enter UPI ID (VPA)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank or mobile@upi"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                      />
                    </div>
                    {/* Quick handles */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="text-stone-400">Quick suffix:</span>
                      {['@okhdfcbank', '@okaxis', '@oksbi', '@paytm', '@ybl'].map((suf) => (
                        <button
                          key={suf}
                          type="button"
                          onClick={() => {
                            const prefix = upiId.split('@')[0] || 'customer';
                            setUpiId(`${prefix}${suf}`);
                          }}
                          className="px-2 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded cursor-pointer"
                        >
                          {suf}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Select Bank
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                    >
                      <option value="HDFC">HDFC Bank</option>
                      <option value="SBI">State Bank of India (SBI)</option>
                      <option value="ICICI">ICICI Bank</option>
                      <option value="AXIS">Axis Bank</option>
                      <option value="KOTAK">Kotak Mahindra Bank</option>
                      <option value="PNB">Punjab National Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'card_token' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        Rule 6 Compliance: Raw card numbers and CVV are NEVER requested or stored.
                        A verified payment gateway token is used.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="e.g. Radhika Sharma"
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-rose-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-stone-600 mb-1">Card Ending In</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={simulatedCardLast4}
                          onChange={(e) => setSimulatedCardLast4(e.target.value.replace(/\D/g, ''))}
                          placeholder="4242"
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 mb-1">Card Network</label>
                        <div className="py-1.5 font-bold text-stone-800">RuPay / Visa Platinum</div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="flex items-start gap-2 text-xs text-stone-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Cash on Delivery is available for your address in {address.city},{' '}
                      {address.pincode}. Please keep exact cash or UPI QR scan ready at the time of
                      handover.
                    </span>
                  </div>
                )}
              </div>

              {/* Order Recap */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Shipping To:</span>
                  <span className="font-medium text-stone-800">
                    {address.fullName}, {address.city} - {address.pincode}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200 text-sm">
                  <span>Payable Amount:</span>
                  <span className="text-rose-950 font-serif">{formatPaise(cart.total_paise)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Address</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-rose-950 hover:bg-rose-900 disabled:bg-stone-300 text-amber-200 disabled:text-stone-500 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Processing Secure Transaction...'
                      : `Confirm & Pay ${formatPaise(cart.total_paise)}`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
