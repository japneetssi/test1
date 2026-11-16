import React, { useState, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess, PlaidLinkOnEvent, PlaidLinkOnExit } from 'react-plaid-link';
import { plaidService } from '../services/plaid';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { Landmark } from 'lucide-react';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
}

export const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ onSuccess }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const data = await plaidService.createLinkToken();
        if (data.link_token) {
          setLinkToken(data.link_token);
        }
      } catch (error) {
        console.error('Error fetching link token:', error);
      }
    };
    fetchToken();
  }, []);

  const handleOnSuccess: PlaidLinkOnSuccess = async (public_token, metadata) => {
    setIsLoading(true);
    try {
      await plaidService.setAccessToken(
        public_token, 
        metadata.institution?.institution_id || '', 
        metadata.institution?.name || 'Unknown Institution'
      );
      toast({
        title: "Bank Linked Successfully",
        description: `Your accounts at ${metadata.institution?.name} have been connected.`,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error Linking Bank",
        description: "There was a problem saving your bank connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnExit: PlaidLinkOnExit = (error, metadata) => {
    if (error) {
      console.error('Plaid Exit Error:', error, metadata);
    }
  };

  const handleOnEvent: PlaidLinkOnEvent = (eventName, metadata) => {
    // Analytics tracking could go here
  };

  const config: PlaidLinkOptions = {
    token: linkToken!,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
    onEvent: handleOnEvent,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button 
      onClick={() => open()} 
      disabled={!ready || !linkToken || isLoading}
      className="flex items-center gap-2"
    >
      <Landmark className="w-5 h-5" />
      {isLoading ? 'Connecting...' : 'Link Bank Account'}
    </Button>
  );
};
