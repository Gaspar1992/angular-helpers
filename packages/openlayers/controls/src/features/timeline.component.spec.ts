import '@angular/compiler';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OlTimelineComponent } from './timeline.component';
import { OlTimeService, OlZoneHelper } from '@angular-helpers/openlayers/core';

describe('OlTimelineComponent', () => {
  let component: OlTimelineComponent;
  let fixture: ComponentFixture<OlTimelineComponent>;
  let timeService: OlTimeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlTimelineComponent],
      providers: [OlTimeService, OlZoneHelper],
    }).compileComponents();

    fixture = TestBed.createComponent(OlTimelineComponent);
    component = fixture.componentInstance;
    timeService = TestBed.inject(OlTimeService);

    // Set required inputs
    fixture.componentRef.setInput('startTime', 1000);
    fixture.componentRef.setInput('endTime', 5000);
    fixture.componentRef.setInput('playSpeed', 10);
    fixture.componentRef.setInput('loop', false);

    fixture.detectChanges();
  });

  it('should initialize and set default values correctly', () => {
    expect(component).toBeTruthy();
    expect(component.startTime()).toBe(1000);
    expect(component.endTime()).toBe(5000);
    expect(component.currentTime()).toBe(1000);
    expect(component.speed()).toBe(10);
    expect(component.isPlaying()).toBe(false);
  });

  it('should toggle play and pause correctly', () => {
    const playSpy = vi.spyOn(timeService, 'play');
    const pauseSpy = vi.spyOn(timeService, 'pause');
    const playStateSpy = vi.spyOn(component.playStateChange, 'emit');

    component.togglePlay();
    expect(playSpy).toHaveBeenCalled();
    expect(playStateSpy).toHaveBeenCalledWith(true);

    // Mock play state
    vi.spyOn(timeService, 'isPlaying').mockReturnValue(true);
    component.togglePlay();
    expect(pauseSpy).toHaveBeenCalled();
    expect(playStateSpy).toHaveBeenCalledWith(false);
  });

  it('should handle scrubbing correctly', () => {
    const setTimeSpy = vi.spyOn(timeService, 'setTime');
    const timeChangeSpy = vi.spyOn(component.timeChange, 'emit');

    const mockEvent = {
      target: { value: '2500' },
    } as unknown as Event;

    component.onScrub(mockEvent);
    expect(setTimeSpy).toHaveBeenCalledWith(2500);

    TestBed.flushEffects();
    expect(timeChangeSpy).toHaveBeenCalledWith(2500);
  });

  it('should handle speed changes correctly', () => {
    const setSpeedSpy = vi.spyOn(timeService, 'setSpeed');

    const mockEvent = {
      target: { value: '60' },
    } as unknown as Event;

    component.onSpeedChange(mockEvent);
    expect(setSpeedSpy).toHaveBeenCalledWith(60);
  });

  it('should loop time-series when currentTime reaches endTime and loop is true', async () => {
    fixture.componentRef.setInput('loop', true);
    fixture.detectChanges();

    const setTimeSpy = vi.spyOn(timeService, 'setTime');

    // Simulate playing and reaching the end
    timeService.play();
    timeService.setTime(5500);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(setTimeSpy).toHaveBeenCalledWith(1000);
  });

  it('should stop playback when currentTime reaches endTime and loop is false', async () => {
    fixture.componentRef.setInput('loop', false);
    fixture.detectChanges();

    const pauseSpy = vi.spyOn(timeService, 'pause');
    const setTimeSpy = vi.spyOn(timeService, 'setTime');

    // Simulate playing and reaching the end
    timeService.play();
    timeService.setTime(5500);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(pauseSpy).toHaveBeenCalled();
    expect(setTimeSpy).toHaveBeenCalledWith(5000);
  });
});
