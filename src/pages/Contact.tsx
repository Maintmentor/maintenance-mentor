import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Globe,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FloatingChatButton from '@/components/FloatingChatButton';
import { supabase } from '@/lib/supabase';

interface FormData {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
  company?: string;
  preferredContact?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    inquiryType: '',
    message: '',
    company: '',
    preferredContact: 'email'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const inquiryTypes = [
    { value: 'general', label: 'General Question', icon: HelpCircle },
    { value: 'technical', label: 'Technical Support', icon: Headphones },
    { value: 'feature', label: 'Feature Request', icon: MessageSquare },
    { value: 'bug', label: 'Bug Report', icon: AlertCircle },
    { value: 'billing', label: 'Subscription/Billing', icon: Building2 },
    { value: 'partnership', label: 'Partnership Inquiry', icon: Globe },
    { value: 'other', label: 'Other', icon: Mail }
  ];

  const faqs: FAQ[] = [
    {
      question: 'How quickly will I receive a response?',
      answer: 'We typically respond to all inquiries within 24 hours during business days. For urgent technical issues, we prioritize responses and aim to get back to you within a few hours.'
    },
    {
      question: 'What information should I include in my message?',
      answer: 'Please include as much detail as possible about your inquiry. For technical issues, include your device type, browser, and steps to reproduce the problem. For feature requests, describe your use case and how the feature would help you.'
    },
    {
      question: 'Can I schedule a demo or consultation?',
      answer: 'Absolutely! Select "Partnership Inquiry" as your inquiry type and mention that you\'d like to schedule a demo. Our team will reach out to arrange a convenient time.'
    },
    {
      question: 'Is there phone support available?',
      answer: 'Yes, phone support is available Monday through Friday, 9 AM to 5 PM EST. For immediate assistance, you can call us at 1-352-575-3472.'
    },
    {
      question: 'How do I report a security vulnerability?',
      answer: 'For security-related issues, please email us directly at security@maintenancementor.net. We take security very seriously and will respond promptly to any concerns.'
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Inquiry type validation
    if (!formData.inquiryType) {
      newErrors.inquiryType = 'Please select an inquiry type';
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Submit to database
      const { data: dbData, error: dbError } = await supabase
        .from('contact_inquiries')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          inquiry_type: formData.inquiryType,
          message: formData.message.trim(),
          status: 'new'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Send email notifications via edge function
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('contact-form-handler', {
          body: {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            company: formData.company?.trim() || '',
            inquiryType: formData.inquiryType,
            message: formData.message.trim(),
            submittedAt: new Date().toISOString()
          }
        });

        if (emailError) {
          console.warn('Email notification warning:', emailError);
        } else {
          console.log('Email notifications sent:', emailData);
        }
      } catch (emailError) {
        console.warn('Email notification skipped:', emailError);
        // Don't fail the form submission if email fails
      }

      setSubmitStatus('success');
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiryType: '',
        message: '',
        company: '',
        preferredContact: 'email'
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Get in Touch With Us
              </h1>
              <p className="text-xl text-orange-100 mb-8">
                Have questions about our AI-powered repair assistant? Our team is here to help you get the most out of Maintenance Mentor.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Clock className="w-5 h-5" />
                  <span>24hr Response Time</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Headphones className="w-5 h-5" />
                  <span>Expert Support</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-10 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <Headphones className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">We're Here to Help</h3>
                  <p className="text-orange-100 text-lg max-w-sm">
                    Our dedicated support team is ready to assist you with any questions or concerns.
                  </p>
                  <div className="flex gap-4 mt-4">
                    <div className="bg-white/20 rounded-xl px-6 py-3 text-center">
                      <div className="text-3xl font-bold text-white">24hr</div>
                      <div className="text-orange-200 text-sm">Response Time</div>
                    </div>
                    <div className="bg-white/20 rounded-xl px-6 py-3 text-center">
                      <div className="text-3xl font-bold text-white">98%</div>
                      <div className="text-orange-200 text-sm">Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <main className="flex-grow py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Contact Form - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Send className="w-6 h-6 text-orange-500" />
                    Send Us a Message
                  </CardTitle>
                  <CardDescription className="text-base">
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name and Email Row */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={`h-12 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`h-12 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Phone and Company Row */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`h-12 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-sm font-semibold">
                          Company Name <span className="text-gray-400">(Optional)</span>
                        </Label>
                        <Input
                          id="company"
                          placeholder="Your Company"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="h-12 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Inquiry Type */}
                    <div className="space-y-2">
                      <Label htmlFor="inquiryType" className="text-sm font-semibold">
                        Inquiry Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.inquiryType} 
                        onValueChange={(value) => handleInputChange('inquiryType', value)}
                      >
                        <SelectTrigger 
                          className={`h-12 ${errors.inquiryType ? 'border-red-500' : ''}`}
                        >
                          <SelectValue placeholder="Select the type of inquiry" />
                        </SelectTrigger>
                        <SelectContent>
                          {inquiryTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4 text-orange-500" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.inquiryType && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.inquiryType}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-semibold">
                        Your Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        rows={5}
                        placeholder="Please describe your inquiry in detail..."
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        className={`resize-none ${errors.message ? 'border-red-500 focus:ring-red-500' : 'focus:ring-orange-500'}`}
                      />
                      <div className="flex justify-between items-center">
                        {errors.message ? (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.message}
                          </p>
                        ) : (
                          <span></span>
                        )}
                        <span className="text-sm text-gray-400">
                          {formData.message.length} characters
                        </span>
                      </div>
                    </div>

                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertDescription className="text-green-800 ml-2">
                          <strong>Thank you!</strong> Your message has been submitted successfully. 
                          We've sent a confirmation email to your inbox. Our team will get back to you within 24 hours.
                        </AlertDescription>
                      </Alert>
                    )}


                    {submitStatus === 'error' && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800 ml-2">
                          <strong>Oops!</strong> Something went wrong. Please try again or email us directly at{' '}
                          <a href="mailto:info@maintenancementor.net" className="underline">
                            info@maintenancementor.net
                          </a>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending Message...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Send Message
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Contact Info & Hours */}
            <div className="space-y-6">
              {/* Contact Information Card */}
              <Card className="shadow-lg border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <a 
                    href="mailto:info@maintenancementor.net" 
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <p className="text-orange-600 group-hover:underline">info@maintenancementor.net</p>
                    </div>
                  </a>
                  
                  <a 
                    href="tel:+13525753472" 
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Phone</p>
                      <p className="text-orange-600 group-hover:underline">1-352-575-3472</p>
                    </div>
                  </a>
                  
                  <div className="flex items-start gap-4 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-gray-600">Gainesville, FL 32618</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Hours Card */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Support Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-semibold text-green-600">9 AM - 5 PM EST</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-semibold text-gray-400">Closed</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-semibold text-gray-400">Closed</span>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> We typically respond within 24 hours during business days.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Help Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Need Quick Help?</h3>
                      <p className="text-gray-300 text-sm">Try our AI Assistant</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    Get instant answers to common questions using our AI-powered chat assistant.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-white text-white hover:bg-white hover:text-gray-900 transition-colors"
                    onClick={() => {
                      // Trigger the floating chat button
                      const chatButton = document.querySelector('[data-chat-button]') as HTMLButtonElement;
                      if (chatButton) chatButton.click();
                    }}
                  >
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Find quick answers to common questions about contacting our support team
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <Card 
                  key={index} 
                  className={`shadow-md border-0 cursor-pointer transition-all duration-300 ${
                    expandedFaq === index ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'
                  }`}
                  onClick={() => toggleFaq(index)}
                >
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                      </div>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-orange-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    {expandedFaq === index && (
                      <div className="px-5 pb-5 pt-0">
                        <div className="pl-11 text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-orange-100 text-lg mb-6 max-w-2xl mx-auto">
              Our team is dedicated to helping you succeed with Maintenance Mentor. 
              Don't hesitate to reach out - we're here to help!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg"
                className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <Send className="w-5 h-5 mr-2" />
                Send a Message
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20"
                onClick={() => window.location.href = 'tel:+13525753472'}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call Us Now
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <FloatingChatButton />
    </div>
  );
};

export default Contact;
